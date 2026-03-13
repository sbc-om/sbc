#!/usr/bin/env python3

import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import fitz
from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph
from pdf2docx import Converter


ARABIC_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
ARABIC_FONT = "Arial"


def contains_arabic(text: str) -> bool:
    return bool(ARABIC_RE.search(text or ""))


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text or "")
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def simplify_for_match(text: str) -> str:
    normalized = normalize_text(text)
    normalized = re.sub(r"[^\w\u0600-\u06FF]+", "", normalized)
    return normalized


def similarity(left: str, right: str) -> float:
    left_simple = simplify_for_match(left)
    right_simple = simplify_for_match(right)
    if not left_simple or not right_simple:
        return 0.0
    return SequenceMatcher(None, left_simple, right_simple).ratio()


def join_words(words: list[str]) -> str:
    return normalize_text(" ".join(word for word in words if word))


def extract_arabic_units(pdf_path: Path) -> list[str]:
    units: list[str] = []
    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            words = page.get_text("words", sort=True)
            blocks: dict[tuple[int, int], list[str]] = {}
            for word in words:
                block_no = int(word[5])
                line_no = int(word[6])
                token = normalize_text(str(word[4]))
                if not token:
                    continue
                blocks.setdefault((block_no, line_no), []).append(token)

            block_lines: dict[int, list[tuple[int, str]]] = {}
            for (block_no, line_no), line_words in blocks.items():
                line_text = join_words(line_words)
                if not contains_arabic(line_text):
                    continue
                block_lines.setdefault(block_no, []).append((line_no, line_text))

            for _, lines in sorted(block_lines.items()):
                ordered_lines = [text for _, text in sorted(lines, key=lambda item: item[0])]
                block_text = normalize_text(" ".join(ordered_lines))
                if block_text:
                    units.append(block_text)

    return units


def set_paragraph_bidi(paragraph: Paragraph) -> None:
    p_pr = paragraph._p.get_or_add_pPr()

    bidi = p_pr.find(qn("w:bidi"))
    if bidi is None:
        bidi = OxmlElement("w:bidi")
        p_pr.append(bidi)
    bidi.set(qn("w:val"), "1")

    jc = p_pr.find(qn("w:jc"))
    if jc is None:
        jc = OxmlElement("w:jc")
        p_pr.append(jc)
    jc.set(qn("w:val"), "right")


def set_run_rtl(run) -> None:
    run.font.name = ARABIC_FONT

    r_pr = run._r.get_or_add_rPr()
    rtl = r_pr.find(qn("w:rtl"))
    if rtl is None:
        rtl = OxmlElement("w:rtl")
        r_pr.append(rtl)
    rtl.set(qn("w:val"), "1")

    r_fonts = r_pr.find(qn("w:rFonts"))
    if r_fonts is None:
        r_fonts = OxmlElement("w:rFonts")
        r_pr.append(r_fonts)

    for attr in ("w:ascii", "w:hAnsi", "w:cs"):
        r_fonts.set(qn(attr), ARABIC_FONT)


def iter_paragraphs(parent):
    if isinstance(parent, DocumentObject):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise TypeError(f"Unsupported parent type: {type(parent)!r}")

    for child in parent_elm.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
            continue

        if child.tag != qn("w:tbl"):
            continue

        table = Table(child, parent)
        seen_cells: set[int] = set()
        for row in table.rows:
            for cell in row.cells:
                cell_id = id(cell._tc)
                if cell_id in seen_cells:
                    continue
                seen_cells.add(cell_id)
                yield from iter_paragraphs(cell)


def find_best_unit(target: str, units: list[str], cursor: int) -> tuple[str | None, int]:
    search_start = max(cursor, 0)
    search_end = min(len(units), search_start + 15)
    best_text = None
    best_index = cursor
    best_score = 0.0

    for index in range(search_start, search_end):
        candidate = units[index]
        score = similarity(target, candidate)
        if score > best_score:
            best_score = score
            best_text = candidate
            best_index = index

    dense_arabic = contains_arabic(target) and target.count(" ") <= 1
    if best_text and (best_score >= 0.55 or (dense_arabic and best_score >= 0.3)):
        return best_text, best_index

    return None, cursor


def repair_arabic_docx(docx_path: Path, pdf_path: Path) -> None:
    units = extract_arabic_units(pdf_path)
    if not units:
        return

    document = Document(docx_path)
    cursor = 0

    for paragraph in iter_paragraphs(document):
        original_text = normalize_text(paragraph.text)
        if not original_text or not contains_arabic(original_text):
            continue

        replacement, matched_index = find_best_unit(original_text, units, cursor)
        if replacement:
            paragraph.clear()
            run = paragraph.add_run(replacement)
            set_run_rtl(run)
            cursor = matched_index + 1
        else:
            for run in paragraph.runs:
                if contains_arabic(run.text):
                    set_run_rtl(run)

        set_paragraph_bidi(paragraph)

    document.save(docx_path)


def convert(pdf_path: Path, docx_path: Path) -> None:
    converter = Converter(str(pdf_path))
    try:
        converter.convert(
            str(docx_path),
            delete_end_line_hyphen=True,
            raw_exceptions=True,
        )
    finally:
        converter.close()

    repair_arabic_docx(docx_path, pdf_path)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: pdf_to_docx.py <input.pdf> <output.docx>", file=sys.stderr)
        return 2

    pdf_path = Path(sys.argv[1]).resolve()
    docx_path = Path(sys.argv[2]).resolve()
    convert(pdf_path, docx_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
