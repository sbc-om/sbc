import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

/** 10 MB limit */
const MAX_FILE_SIZE = 10 * 1024 * 1024;
let isPdfWorkerConfigured = false;

function resolvePdfPythonCommand() {
  return process.env.PDF_TO_DOCX_PYTHON || "python3";
}

function resolvePdfPythonPath() {
  if (process.env.PDF_TO_DOCX_PYTHONPATH) {
    return process.env.PDF_TO_DOCX_PYTHONPATH;
  }

  const libDir = path.join(process.cwd(), ".venv-pdf", "lib");
  if (!fs.existsSync(libDir)) return null;

  for (const entry of fs.readdirSync(libDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("python")) continue;
    const sitePackages = path.join(libDir, entry.name, "site-packages");
    if (fs.existsSync(sitePackages)) return sitePackages;
  }

  return null;
}

function resolvePdf2DocxCommand() {
  const candidates = [
    process.env.PDF2DOCX_BIN,
    path.join(process.cwd(), ".venv-pdf/bin/pdf2docx"),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function resolveWorkerPath() {
  const cwd = process.cwd();
  const directCandidates = [
    path.join(cwd, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
    path.join(cwd, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"),
    path.join(cwd, "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"),
    path.join(cwd, "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs"),
  ];

  for (const candidate of directCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const pnpmStore = path.join(cwd, "node_modules/.pnpm");
  if (!fs.existsSync(pnpmStore)) return null;

  const pnpmEntries = fs.readdirSync(pnpmStore, { withFileTypes: true });
  const pnpmCandidates: string[] = [];

  for (const entry of pnpmEntries) {
    if (!entry.isDirectory()) continue;

    if (entry.name.startsWith("pdfjs-dist@")) {
      pnpmCandidates.push(
        path.join(
          pnpmStore,
          entry.name,
          "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
        ),
      );
      pnpmCandidates.push(
        path.join(
          pnpmStore,
          entry.name,
          "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        ),
      );
    }

    if (entry.name.startsWith("pdf-parse@")) {
      pnpmCandidates.push(
        path.join(
          pnpmStore,
          entry.name,
          "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
        ),
      );
      pnpmCandidates.push(
        path.join(
          pnpmStore,
          entry.name,
          "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs",
        ),
      );
    }
  }

  for (const candidate of pnpmCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function ensurePdfWorkerConfigured() {
  if (isPdfWorkerConfigured) return;

  const workerPath = resolveWorkerPath();
  if (!workerPath) {
    throw new Error("Unable to locate PDF worker file");
  }

  const workerCode = fs.readFileSync(workerPath, "utf8");
  const workerDataUrl = `data:text/javascript;base64,${Buffer.from(workerCode).toString("base64")}`;
  PDFParse.setWorker(workerDataUrl);
  isPdfWorkerConfigured = true;
}

async function convertWithArabicOptimizedPipeline(inputPath: string, outputPath: string, workingDir: string) {
  const pythonCommand = resolvePdfPythonCommand();
  const scriptPath = path.join(process.cwd(), "scripts/pdf_to_docx.py");
  if (!fs.existsSync(scriptPath)) {
    throw new Error("Arabic-optimized converter script is missing");
  }
  const pythonPath = resolvePdfPythonPath();
  if (!pythonPath) {
    throw new Error("Arabic-optimized converter dependencies are not available");
  }

  await execFileAsync(
    pythonCommand,
    [scriptPath, inputPath, outputPath],
    {
      cwd: workingDir,
      env: {
        ...process.env,
        HOME: workingDir,
        TMPDIR: workingDir,
        XDG_CACHE_HOME: path.join(workingDir, ".cache"),
        XDG_CONFIG_HOME: path.join(workingDir, ".config"),
        XDG_RUNTIME_DIR: workingDir,
        PYTHONPATH: process.env.PYTHONPATH
          ? `${pythonPath}:${process.env.PYTHONPATH}`
          : pythonPath,
      },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 300_000,
    },
  );

  if (!fs.existsSync(outputPath)) {
    throw new Error("Arabic-optimized converter did not produce a DOCX file");
  }

  return fs.readFileSync(outputPath);
}

async function convertWithPdf2Docx(inputPath: string, outputPath: string, workingDir: string) {
  const pdf2docxCommand = resolvePdf2DocxCommand();
  if (!pdf2docxCommand) {
    throw new Error("pdf2docx converter is not available");
  }

  await execFileAsync(
    pdf2docxCommand,
    ["convert", inputPath, "--docx_file", outputPath],
    {
      cwd: workingDir,
      env: {
        ...process.env,
        HOME: workingDir,
        TMPDIR: workingDir,
        XDG_CACHE_HOME: path.join(workingDir, ".cache"),
        XDG_CONFIG_HOME: path.join(workingDir, ".config"),
        XDG_RUNTIME_DIR: workingDir,
      },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 300_000,
    },
  );

  if (!fs.existsSync(outputPath)) {
    throw new Error("pdf2docx did not produce a DOCX file");
  }

  return fs.readFileSync(outputPath);
}

async function convertWithLibreOffice(inputPath: string, outputDir: string) {
  const command = 'docx:"MS Word 2007 XML"';
  await execFileAsync(
    "libreoffice",
    [
      "--headless",
      "--infilter=writer_pdf_import",
      "--convert-to",
      command,
      "--outdir",
      outputDir,
      inputPath,
    ],
    {
      cwd: outputDir,
      env: {
        ...process.env,
        HOME: outputDir,
        TMPDIR: outputDir,
        XDG_CACHE_HOME: path.join(outputDir, ".cache"),
        XDG_CONFIG_HOME: path.join(outputDir, ".config"),
        XDG_RUNTIME_DIR: outputDir,
      },
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    },
  );

  const outputPath = path.join(
    outputDir,
    `${path.basename(inputPath, path.extname(inputPath))}.docx`,
  );

  if (!fs.existsSync(outputPath)) {
    throw new Error("LibreOffice did not produce a DOCX file");
  }

  return fs.readFileSync(outputPath);
}

async function convertWithTextExtraction(buffer: Buffer) {
  ensurePdfWorkerConfigured();

  const parser = new PDFParse({ data: buffer });

  let text = "";
  try {
    const result = await parser.getText();
    text = result.text ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  if (!text.trim()) {
    throw new Error("No extractable text found in the PDF");
  }

  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;
  const isRtl = rtlRegex.test(text);

  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const docParagraphs = paragraphs.map(
    (paragraph) =>
      new Paragraph({
        alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: isRtl,
        children: [
          new TextRun({
            text: paragraph,
            size: 24,
            font: isRtl ? "Arial" : "Calibri",
            rightToLeft: isRtl,
          }),
        ],
        spacing: { after: 200 },
      }),
  );

  const doc = new Document({
    sections: [
      {
        children: docParagraphs,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function cleanupTempDir(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

export async function POST(req: NextRequest) {
  let tmpDir: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No PDF file provided" },
        { status: 400 },
      );
    }

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { ok: false, error: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "File size exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputName = file.name.replace(/\.pdf$/i, ".docx");

    let docxBuffer: Buffer;
    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sbc-pdf-to-word-"));
      fs.mkdirSync(path.join(tmpDir, ".cache"), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, ".config"), { recursive: true });
      const inputPath = path.join(tmpDir, "input.pdf");
      const pdf2docxOutputPath = path.join(tmpDir, "output.docx");
      fs.writeFileSync(inputPath, buffer);

      try {
        docxBuffer = await convertWithArabicOptimizedPipeline(
          inputPath,
          pdf2docxOutputPath,
          tmpDir,
        );
      } catch (arabicOptimizedError) {
        console.error("pdf-to-word arabic-optimized conversion failed", arabicOptimizedError);

        try {
          docxBuffer = await convertWithPdf2Docx(inputPath, pdf2docxOutputPath, tmpDir);
        } catch (pdf2docxError) {
          console.error("pdf-to-word pdf2docx conversion failed", pdf2docxError);
          docxBuffer = await convertWithLibreOffice(inputPath, tmpDir);
        }
      }
    } catch (layoutPreservingError) {
      console.error("pdf-to-word layout-preserving conversion failed", layoutPreservingError);
      docxBuffer = await convertWithTextExtraction(buffer);
    }

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(outputName)}"`,
      },
    });
  } catch (error) {
    console.error("pdf-to-word conversion failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to convert PDF" },
      { status: 500 },
    );
  } finally {
    if (tmpDir) cleanupTempDir(tmpDir);
  }
}
