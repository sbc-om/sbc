"use client";

import { useState } from "react";
import {
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiChevronUp,
  HiChevronDown,
  HiOutlinePhoto,
  HiOutlineDocumentText,
  HiOutlineStar,
  HiOutlinePlayCircle,
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCodeBracket,
  HiOutlineRectangleGroup,
  HiOutlineBars3,
} from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";
import type { WebsiteBlock } from "@/lib/db/types";

const BLOCK_TYPES: {
  type: WebsiteBlock["type"];
  label: { en: string; ar: string };
  Icon: typeof HiOutlineDocumentText;
}[] = [
  { type: "hero", label: { en: "Hero Banner", ar: "بانر رئيسي" }, Icon: HiOutlineRectangleGroup },
  { type: "text", label: { en: "Text", ar: "نص" }, Icon: HiOutlineDocumentText },
  { type: "image", label: { en: "Image", ar: "صورة" }, Icon: HiOutlinePhoto },
  { type: "gallery", label: { en: "Gallery", ar: "معرض صور" }, Icon: HiOutlinePhoto },
  { type: "features", label: { en: "Features", ar: "مميزات" }, Icon: HiOutlineStar },
  { type: "cta", label: { en: "Call to Action", ar: "دعوة لاتخاذ إجراء" }, Icon: HiOutlineChatBubbleLeftRight },
  { type: "testimonials", label: { en: "Testimonials", ar: "آراء العملاء" }, Icon: HiOutlineChatBubbleLeftRight },
  { type: "contact-form", label: { en: "Contact Form", ar: "نموذج تواصل" }, Icon: HiOutlineChatBubbleLeftRight },
  { type: "map", label: { en: "Map", ar: "خريطة" }, Icon: HiOutlineMapPin },
  { type: "video", label: { en: "Video", ar: "فيديو" }, Icon: HiOutlinePlayCircle },
  { type: "divider", label: { en: "Divider", ar: "فاصل" }, Icon: HiOutlineBars3 },
  { type: "html", label: { en: "Custom HTML", ar: "HTML مخصص" }, Icon: HiOutlineCodeBracket },
];

function createDefaultBlock(type: WebsiteBlock["type"]): WebsiteBlock {
  switch (type) {
    case "hero":
      return { type: "hero", data: { heading: { en: "Welcome", ar: "مرحباً" } } };
    case "text":
      return { type: "text", data: { content: { en: "Your text here", ar: "النص هنا" } } };
    case "image":
      return { type: "image", data: { url: "", alt: "" } };
    case "gallery":
      return { type: "gallery", data: { images: [] } };
    case "features":
      return {
        type: "features",
        data: {
          items: [{ title: { en: "Feature 1", ar: "ميزة 1" }, description: { en: "Description", ar: "الوصف" } }],
        },
      };
    case "cta":
      return {
        type: "cta",
        data: {
          heading: { en: "Get Started", ar: "ابدأ الآن" },
          buttonText: { en: "Learn More", ar: "اعرف المزيد" },
          buttonLink: "#",
        },
      };
    case "testimonials":
      return { type: "testimonials", data: { items: [] } };
    case "contact-form":
      return {
        type: "contact-form",
        data: { heading: { en: "Contact Us", ar: "تواصل معنا" }, fields: ["name", "email", "message"] },
      };
    case "map":
      return { type: "map", data: { latitude: 23.5880, longitude: 58.3829, zoom: 12 } };
    case "video":
      return { type: "video", data: { url: "" } };
    case "divider":
      return { type: "divider", data: {} };
    case "html":
      return { type: "html", data: { code: "" } };
  }
}

interface Props {
  locale: Locale;
  pageId: string;
  blocks: WebsiteBlock[];
  onSave: (blocks: WebsiteBlock[]) => void;
}

export function PageBlockEditor({ locale, pageId, blocks: initialBlocks, onSave }: Props) {
  const ar = locale === "ar";
  const [blocks, setBlocks] = useState<WebsiteBlock[]>(initialBlocks);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateBlocks = (newBlocks: WebsiteBlock[]) => {
    setBlocks(newBlocks);
    setDirty(true);
  };

  const addBlock = (type: WebsiteBlock["type"]) => {
    updateBlocks([...blocks, createDefaultBlock(type)]);
    setShowAddMenu(false);
  };

  const removeBlock = (index: number) => {
    updateBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const arr = [...blocks];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    updateBlocks(arr);
  };

  const updateBlockData = (index: number, data: Record<string, unknown>) => {
    updateBlocks(
      blocks.map((b, i) =>
        i === index ? ({ ...b, data: { ...b.data, ...data } } as WebsiteBlock) : b
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(blocks);
    setSaving(false);
    setDirty(false);
  };

  return (
    <div>
      {/* Save bar */}
      {dirty && (
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-xl bg-accent/10 border border-accent/20 px-4 py-2.5">
          <span className="text-sm font-medium text-accent">
            {ar ? "تغييرات غير محفوظة" : "Unsaved changes"}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving
              ? ar ? "جاري الحفظ…" : "Saving…"
              : ar ? "حفظ" : "Save"}
          </Button>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => {
          const meta = BLOCK_TYPES.find((bt) => bt.type === block.type);
          return (
            <div
              key={`${block.type}-${index}`}
              className="group sbc-card rounded-2xl overflow-hidden"
            >
              {/* Block header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-(--surface-border) bg-(--surface)/50">
                {meta && <meta.Icon className="h-4 w-4 text-(--muted-foreground)" />}
                <span className="text-sm font-semibold flex-1">
                  {meta?.label[locale] ?? block.type}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-(--chip-bg) disabled:opacity-30 transition"
                  >
                    <HiChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 1)}
                    disabled={index === blocks.length - 1}
                    className="p-1 rounded hover:bg-(--chip-bg) disabled:opacity-30 transition"
                  >
                    <HiChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    className="p-1 rounded text-red-500 hover:bg-red-500/10 transition"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Block content editor */}
              <div className="p-4">
                <BlockFieldEditor
                  locale={locale}
                  block={block}
                  onChange={(data) => updateBlockData(index, data)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add block button */}
      <div className="mt-4 relative">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-(--surface-border) px-4 py-6 text-sm text-(--muted-foreground) hover:border-accent/40 hover:text-accent transition"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          {ar ? "إضافة بلوك" : "Add Block"}
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full mb-2 left-0 right-0 z-20 rounded-2xl bg-(--surface) shadow-lg border border-(--surface-border) p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                type="button"
                onClick={() => addBlock(bt.type)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-accent/10 hover:text-accent transition text-start"
              >
                <bt.Icon className="h-4 w-4 shrink-0" />
                <span>{bt.label[locale]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Inline field editors for each block type
   ============================================================ */
function BlockFieldEditor({
  locale,
  block,
  onChange,
}: {
  locale: Locale;
  block: WebsiteBlock;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const ar = locale === "ar";

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "العنوان (EN)" : "Heading (EN)"}
            </label>
            <Input
              value={block.data.heading.en}
              onChange={(e) =>
                onChange({ heading: { ...block.data.heading, en: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "العنوان (AR)" : "Heading (AR)"}
            </label>
            <Input
              dir="rtl"
              value={block.data.heading.ar}
              onChange={(e) =>
                onChange({ heading: { ...block.data.heading, ar: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "رابط الصورة" : "Image URL"}
            </label>
            <Input
              value={block.data.imageUrl ?? ""}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "المحتوى (EN)" : "Content (EN)"}
            </label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl p-3 text-sm text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50"
              style={{ border: "2px solid var(--surface-border)", backgroundColor: "var(--background)" }}
              value={block.data.content.en}
              onChange={(e) =>
                onChange({ content: { ...block.data.content, en: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "المحتوى (AR)" : "Content (AR)"}
            </label>
            <textarea
              dir="rtl"
              rows={4}
              className="mt-1 w-full rounded-xl p-3 text-sm text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50"
              style={{ border: "2px solid var(--surface-border)", backgroundColor: "var(--background)" }}
              value={block.data.content.ar}
              onChange={(e) =>
                onChange({ content: { ...block.data.content, ar: e.target.value } })
              }
            />
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "رابط الصورة" : "Image URL"}
            </label>
            <Input
              value={block.data.url}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "النص البديل" : "Alt Text"}
            </label>
            <Input
              value={block.data.alt ?? ""}
              onChange={(e) => onChange({ alt: e.target.value })}
            />
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "العنوان (EN)" : "Heading (EN)"}
            </label>
            <Input
              value={block.data.heading.en}
              onChange={(e) =>
                onChange({ heading: { ...block.data.heading, en: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "نص الزر (EN)" : "Button Text (EN)"}
            </label>
            <Input
              value={block.data.buttonText.en}
              onChange={(e) =>
                onChange({ buttonText: { ...block.data.buttonText, en: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">
              {ar ? "رابط الزر" : "Button Link"}
            </label>
            <Input
              value={block.data.buttonLink}
              onChange={(e) => onChange({ buttonLink: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      );

    case "video":
      return (
        <div>
          <label className="text-xs font-medium text-(--muted-foreground)">
            {ar ? "رابط الفيديو" : "Video URL"}
          </label>
          <Input
            value={block.data.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://youtube.com/..."
          />
        </div>
      );

    case "map":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">Latitude</label>
            <Input
              type="number"
              step="any"
              value={block.data.latitude}
              onChange={(e) => onChange({ latitude: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">Longitude</label>
            <Input
              type="number"
              step="any"
              value={block.data.longitude}
              onChange={(e) => onChange({ longitude: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-(--muted-foreground)">Zoom</label>
            <Input
              type="number"
              value={block.data.zoom ?? 12}
              onChange={(e) => onChange({ zoom: parseInt(e.target.value) || 12 })}
            />
          </div>
        </div>
      );

    case "html":
      return (
        <div>
          <label className="text-xs font-medium text-(--muted-foreground)">
            {ar ? "كود HTML" : "HTML Code"}
          </label>
          <textarea
            rows={6}
            className="mt-1 w-full rounded-xl p-3 text-sm font-mono text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50"
            style={{ border: "2px solid var(--surface-border)", backgroundColor: "var(--background)" }}
            value={block.data.code}
            onChange={(e) => onChange({ code: e.target.value })}
          />
        </div>
      );

    case "divider":
      return (
        <div className="text-xs text-(--muted-foreground) text-center py-2">
          <hr className="border-(--surface-border)" />
          <span className="mt-1 block">{ar ? "فاصل أفقي" : "Horizontal divider"}</span>
        </div>
      );

    default:
      return (
        <div className="text-sm text-(--muted-foreground)">
          {ar ? "محرر هذا البلوك قيد التطوير" : "Editor for this block type is coming soon."}
        </div>
      );
  }
}
