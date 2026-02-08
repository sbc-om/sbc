"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { LuZoomIn, LuType, LuSmile, LuSparkles, LuMessageSquareText, LuRefreshCw, LuX, LuCheck, LuUpload, LuTrash2 } from "react-icons/lu";

import type { StoryOverlays } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface StoryEditorProps {
  businessId: string;
  locale: Locale;
  onClose: () => void;
  onStoryCreated: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  rotation: number;
  scale: number;
}

interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

type EditorTab = "adjust" | "text" | "sticker" | "filter" | "caption";

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const FILTERS: { key: string; label: string; css: string }[] = [
  { key: "none", label: "None", css: "" },
  { key: "grayscale", label: "B&W", css: "grayscale(100%)" },
  { key: "sepia", label: "Sepia", css: "sepia(80%)" },
  { key: "warm", label: "Warm", css: "saturate(1.3) sepia(20%) brightness(1.1)" },
  { key: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(10deg) brightness(1.05)" },
  { key: "vintage", label: "Vintage", css: "sepia(30%) contrast(1.1) brightness(0.95)" },
  { key: "dramatic", label: "Drama", css: "contrast(1.4) saturate(1.2) brightness(0.9)" },
  { key: "fade", label: "Fade", css: "contrast(0.9) brightness(1.1) saturate(0.8)" },
  { key: "vivid", label: "Vivid", css: "saturate(1.5) contrast(1.1)" },
];

const FONTS = ["sans-serif", "serif", "monospace", "cursive", "fantasy"];
const TEXT_COLORS = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#06b6d4"];
const BG_COLORS = ["transparent", "rgba(0,0,0,0.6)", "rgba(255,255,255,0.8)", "rgba(0,0,0,0.9)", "rgba(239,68,68,0.7)", "rgba(59,130,246,0.7)", "rgba(34,197,94,0.7)"];

const EMOJIS = ["😀","😂","🥰","😎","🔥","❤️","💯","👏","🎉","✨","😍","🤩","💪","🙌","⭐","🌟","💫","🎯","🏆","💰","🚀","💎","👑","🌈","🦋","🌸","🍕","🎵","📸","💡","🎁","🤝","💝","🎊","🥳","😱","💥","⚡","🌺","🍀","🦄","🍭","🎨","🏅","🎈","🎀","💐","🌻","🍰","🎶"];

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function buildFilterCSS(filter: string, brightness: number, contrast: number, saturation: number): string {
  const f = FILTERS.find((x) => x.key === filter)?.css ?? "";
  return `${f} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`.trim();
}

/** Determines if image is close enough to 9:16 to use object-cover */
function shouldUseCover(w: number, h: number): boolean {
  const ratio = w / h;
  const target = 9 / 16; // 0.5625
  return ratio >= target * 0.75 && ratio <= target * 1.25;
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export function StoryEditor({ businessId, locale, onClose, onStoryCreated }: StoryEditorProps) {
  const ar = locale === "ar";

  /* ── File state ── */
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  /* ── Editor state ── */
  const [activeTab, setActiveTab] = useState<EditorTab>("adjust");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  /* ── Adjustments ── */
  const [filter, setFilter] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  /* ── Zoom & Pan ── */
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const isDraggingImage = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  /* ── Caption ── */
  const [caption, setCaption] = useState("");

  /* ── Upload ── */
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  /* ── Refs ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ── Overlay drag ── */
  const isDraggingOverlay = useRef(false);
  const overlayDragStart = useRef({ x: 0, y: 0 });
  const overlayPosStart = useRef({ x: 0, y: 0 });

  /* ── Derived ── */
  const fitMode = naturalSize ? (shouldUseCover(naturalSize.w, naturalSize.h) ? "cover" : "contain") : "contain";
  const needsBlur = fitMode === "contain";
  const filterCSS = buildFilterCSS(filter, brightness, contrast, saturation);

  /* ═══════ File handling ═══════ */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(f);
    const isVideo = f.type.startsWith("video/");
    setFile(f);
    setFileUrl(url);
    setMediaType(isVideo ? "video" : "image");
    setNaturalSize(null);
    // Reset adjustments
    setFilter("none");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    setTextOverlays([]);
    setStickerOverlays([]);
    setCaption("");
    setActiveTab("adjust");
  }, [fileUrl]);

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  /* ═══════ Overlay operations ═══════ */
  const addText = useCallback(() => {
    const newText: TextOverlay = {
      id: `t-${Date.now()}`,
      text: ar ? "نص" : "Text",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: "sans-serif",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.6)",
      rotation: 0,
      scale: 1,
    };
    setTextOverlays((p) => [...p, newText]);
    setActiveOverlayId(newText.id);
    setEditingTextId(newText.id);
  }, [ar]);

  const addSticker = useCallback((emoji: string) => {
    const s: StickerOverlay = {
      id: `s-${Date.now()}`,
      emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    };
    setStickerOverlays((p) => [...p, s]);
    setActiveOverlayId(s.id);
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setTextOverlays((p) => p.filter((x) => x.id !== id));
    setStickerOverlays((p) => p.filter((x) => x.id !== id));
    if (activeOverlayId === id) setActiveOverlayId(null);
  }, [activeOverlayId]);

  /* ═══════ Overlay dragging ═══════ */
  const handleOverlayPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingOverlay.current = true;
    setActiveOverlayId(id);
    overlayDragStart.current = { x: e.clientX, y: e.clientY };
    const t = textOverlays.find((x) => x.id === id);
    const s = stickerOverlays.find((x) => x.id === id);
    overlayPosStart.current = { x: t?.x ?? s?.x ?? 50, y: t?.y ?? s?.y ?? 50 };

    const move = (ev: PointerEvent) => {
      if (!isDraggingOverlay.current || !previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - overlayDragStart.current.x) / rect.width) * 100;
      const dy = ((ev.clientY - overlayDragStart.current.y) / rect.height) * 100;
      const nx = Math.max(0, Math.min(100, overlayPosStart.current.x + dx));
      const ny = Math.max(0, Math.min(100, overlayPosStart.current.y + dy));
      setTextOverlays((p) => p.map((x) => x.id === id ? { ...x, x: nx, y: ny } : x));
      setStickerOverlays((p) => p.map((x) => x.id === id ? { ...x, x: nx, y: ny } : x));
    };

    const up = () => {
      isDraggingOverlay.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [textOverlays, stickerOverlays]);

  /* ═══════ Image pan ═══════ */
  const handleImagePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-overlay]")) return;
    if (imageScale <= 1) return;
    isDraggingImage.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...imagePosition };

    const move = (ev: PointerEvent) => {
      if (!isDraggingImage.current) return;
      const dx = ((ev.clientX - dragStart.current.x) / (previewRef.current?.clientWidth ?? 1)) * 100;
      const dy = ((ev.clientY - dragStart.current.y) / (previewRef.current?.clientHeight ?? 1)) * 100;
      setImagePosition({ x: posStart.current.x + dx, y: posStart.current.y + dy });
    };

    const up = () => {
      isDraggingImage.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [imageScale, imagePosition]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setImageScale((p) => Math.max(1, Math.min(3, p + (e.deltaY > 0 ? -0.1 : 0.1))));
  }, []);

  /* ═══════ Canvas render (images only) ═══════ */
  const renderToCanvas = useCallback(async (): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Load image
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = fileUrl!;
    });

    // Apply filter
    ctx.filter = filterCSS || "none";

    // Determine draw mode
    const usesCover = shouldUseCover(img.naturalWidth, img.naturalHeight);
    const scale = imageScale;
    const tx = imagePosition.x;
    const ty = imagePosition.y;

    if (usesCover) {
      // object-cover: fill entire canvas, crop overflow
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = W / H;
      let sw = img.naturalWidth, sh = img.naturalHeight;
      let sx = 0, sy = 0;

      if (imgRatio > canvasRatio) {
        sw = img.naturalHeight * canvasRatio;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / canvasRatio;
        sy = (img.naturalHeight - sh) / 2;
      }

      // Apply zoom + pan
      const zw = sw / scale;
      const zh = sh / scale;
      sx += (sw - zw) / 2 - (tx / 100) * zw;
      sy += (sh - zh) / 2 - (ty / 100) * zh;

      ctx.drawImage(img, sx, sy, zw, zh, 0, 0, W, H);
    } else {
      // Blurred background layer
      ctx.save();
      ctx.filter = `${filterCSS || "none"} blur(40px) saturate(1.5) brightness(0.75)`;
      const bgRatio = img.naturalWidth / img.naturalHeight;
      const bgCanvasRatio = W / H;
      let bsw = img.naturalWidth, bsh = img.naturalHeight, bsx = 0, bsy = 0;
      if (bgRatio > bgCanvasRatio) { bsw = img.naturalHeight * bgCanvasRatio; bsx = (img.naturalWidth - bsw) / 2; }
      else { bsh = img.naturalWidth / bgCanvasRatio; bsy = (img.naturalHeight - bsh) / 2; }
      ctx.drawImage(img, bsx, bsy, bsw, bsh, -20, -20, W + 40, H + 40);
      ctx.restore();

      // Dark scrim
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, W, H);

      // Foreground: object-contain
      ctx.filter = filterCSS || "none";
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = W / H;
      let dw: number, dh: number;
      if (imgAspect > canvasAspect) { dw = W; dh = W / imgAspect; }
      else { dh = H; dw = H * imgAspect; }

      // Apply zoom + pan
      dw *= scale;
      dh *= scale;
      const dx = (W - dw) / 2 + (tx / 100) * dw;
      const dy = (H - dh) / 2 + (ty / 100) * dh;

      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Reset filter - overlays will be rendered separately in StoryViewer
    ctx.filter = "none";

    // Note: Text and sticker overlays are NOT baked into the image anymore.
    // They are stored as JSON and rendered dynamically in StoryViewer.
    // This ensures emojis display correctly across all devices/browsers.

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), "image/jpeg", 0.92);
    });
  }, [fileUrl, filterCSS, imageScale, imagePosition]);

  /* ═══════ Publish ═══════ */
  const handlePublish = useCallback(async () => {
    if (!file || !fileUrl) return;
    setIsPublishing(true);
    setPublishError(null);

    try {
      const formData = new FormData();

      // Build overlays object (used for both images and videos)
      const overlays: StoryOverlays = {
        textOverlays: textOverlays.map(({ id, ...rest }) => rest),
        stickerOverlays: stickerOverlays.map(({ id, ...rest }) => rest),
        filter,
        brightness,
        contrast,
        saturation,
        imageScale,
        imagePosition,
      };

      if (mediaType === "image") {
        // Render image with filters to canvas (without text/sticker overlays)
        const blob = await renderToCanvas();
        formData.append("file", blob, "story.jpg");
        formData.append("mediaType", "image");
        // Store overlays separately so they render correctly in StoryViewer
        if (textOverlays.length > 0 || stickerOverlays.length > 0) {
          formData.append("overlays", JSON.stringify(overlays));
        }
      } else {
        // For videos, send original file + overlays JSON
        formData.append("file", file);
        formData.append("mediaType", "video");
        formData.append("overlays", JSON.stringify(overlays));
      }

      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await fetch(`/api/businesses/${businessId}/stories`, { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Failed to publish story");
      onStoryCreated();
    } catch (err: any) {
      setPublishError(err.message || "Something went wrong");
    }
    setIsPublishing(false);
  }, [file, fileUrl, mediaType, businessId, caption, renderToCanvas, textOverlays, stickerOverlays, filter, brightness, contrast, saturation, imageScale, imagePosition, onStoryCreated]);

  /* ═══════ Keyboard ═══════ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Escape") onClose();
      if (e.key === "Delete" && activeOverlayId) removeOverlay(activeOverlayId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, activeOverlayId, removeOverlay]);

  /* ═══════ Active overlay data (for toolbar) ═══════ */
  const activeText = textOverlays.find((x) => x.id === activeOverlayId);
  const activeSticker = stickerOverlays.find((x) => x.id === activeOverlayId);

  /* ═══════ Tool panel content ═══════ */
  const toolPanel = useMemo(() => {
    switch (activeTab) {
      case "adjust":
        return (
          <div className="space-y-5 p-4">
            {/* Zoom */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/70">{ar ? "تكبير" : "Zoom"}</label>
                <span className="text-xs text-white/40">{imageScale.toFixed(1)}x</span>
              </div>
              <input type="range" min="1" max="3" step="0.05" value={imageScale} onChange={(e) => setImageScale(Number(e.target.value))} className="w-full accent-white h-1" />
            </div>
            {/* Brightness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/70">{ar ? "السطوع" : "Brightness"}</label>
                <span className="text-xs text-white/40">{brightness}%</span>
              </div>
              <input type="range" min="50" max="150" step="1" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-white h-1" />
            </div>
            {/* Contrast */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/70">{ar ? "التباين" : "Contrast"}</label>
                <span className="text-xs text-white/40">{contrast}%</span>
              </div>
              <input type="range" min="50" max="150" step="1" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-white h-1" />
            </div>
            {/* Saturation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/70">{ar ? "التشبع" : "Saturation"}</label>
                <span className="text-xs text-white/40">{saturation}%</span>
              </div>
              <input type="range" min="0" max="200" step="1" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-white h-1" />
            </div>
            {/* Reset */}
            <button type="button" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setImageScale(1); setImagePosition({ x: 0, y: 0 }); }} className="w-full py-2 text-xs text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-1">
              <LuRefreshCw className="w-3 h-3" /> {ar ? "إعادة تعيين" : "Reset"}
            </button>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4 p-4">
            <button type="button" onClick={addText} className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <LuType className="w-4 h-4" /> {ar ? "إضافة نص" : "Add Text"}
            </button>
            {activeText && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                {/* Font */}
                <div>
                  <label className="text-xs font-medium text-white/70 mb-2 block">{ar ? "الخط" : "Font"}</label>
                  <div className="flex flex-wrap gap-1.5">{FONTS.map((f) => (
                    <button key={f} type="button" onClick={() => setTextOverlays((p) => p.map((x) => x.id === activeText.id ? { ...x, fontFamily: f } : x))} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${activeText.fontFamily === f ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`} style={{ fontFamily: f }}>{f.split("-")[0]}</button>
                  ))}</div>
                </div>
                {/* Size */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/70">{ar ? "الحجم" : "Size"}</label>
                    <span className="text-xs text-white/40">{activeText.fontSize}px</span>
                  </div>
                  <input type="range" min="12" max="64" step="1" value={activeText.fontSize} onChange={(e) => setTextOverlays((p) => p.map((x) => x.id === activeText.id ? { ...x, fontSize: Number(e.target.value) } : x))} className="w-full accent-white h-1" />
                </div>
                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/70">{ar ? "الدوران" : "Rotation"}</label>
                    <span className="text-xs text-white/40">{activeText.rotation}°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="1" value={activeText.rotation} onChange={(e) => setTextOverlays((p) => p.map((x) => x.id === activeText.id ? { ...x, rotation: Number(e.target.value) } : x))} className="w-full accent-white h-1" />
                </div>
                {/* Text color */}
                <div>
                  <label className="text-xs font-medium text-white/70 mb-2 block">{ar ? "لون النص" : "Color"}</label>
                  <div className="flex flex-wrap gap-2">{TEXT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setTextOverlays((p) => p.map((x) => x.id === activeText.id ? { ...x, color: c } : x))} className={`w-7 h-7 rounded-full border-2 transition-transform ${activeText.color === c ? "border-white scale-125" : "border-white/30 hover:scale-110"}`} style={{ backgroundColor: c }} />
                  ))}</div>
                </div>
                {/* Background color */}
                <div>
                  <label className="text-xs font-medium text-white/70 mb-2 block">{ar ? "لون الخلفية" : "Background"}</label>
                  <div className="flex flex-wrap gap-2">{BG_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setTextOverlays((p) => p.map((x) => x.id === activeText.id ? { ...x, backgroundColor: c } : x))} className={`w-7 h-7 rounded-full border-2 transition-transform ${activeText.backgroundColor === c ? "border-white scale-125" : "border-white/30 hover:scale-110"}`} style={{ backgroundColor: c === "transparent" ? undefined : c }}>{c === "transparent" ? <span className="text-white/50 text-[10px] leading-none">⊘</span> : null}</button>
                  ))}</div>
                </div>
                {/* Delete */}
                <button type="button" onClick={() => removeOverlay(activeText.id)} className="w-full py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors flex items-center justify-center gap-2">
                  <LuTrash2 className="w-4 h-4" /> {ar ? "حذف النص" : "Delete Text"}
                </button>
              </div>
            )}
          </div>
        );

      case "sticker":
        return (
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => addSticker(emoji)} className="text-2xl p-2 rounded-lg hover:bg-white/10 transition-colors active:scale-90">{emoji}</button>
              ))}
            </div>
            {activeSticker && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                {/* Scale */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/70">{ar ? "الحجم" : "Size"}</label>
                    <span className="text-xs text-white/40">{activeSticker.scale.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="0.5" max="3" step="0.1" value={activeSticker.scale} onChange={(e) => setStickerOverlays((p) => p.map((x) => x.id === activeSticker.id ? { ...x, scale: Number(e.target.value) } : x))} className="w-full accent-white h-1" />
                </div>
                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/70">{ar ? "الدوران" : "Rotation"}</label>
                    <span className="text-xs text-white/40">{activeSticker.rotation}°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="1" value={activeSticker.rotation} onChange={(e) => setStickerOverlays((p) => p.map((x) => x.id === activeSticker.id ? { ...x, rotation: Number(e.target.value) } : x))} className="w-full accent-white h-1" />
                </div>
                <button type="button" onClick={() => removeOverlay(activeSticker.id)} className="w-full py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors flex items-center justify-center gap-2">
                  <LuTrash2 className="w-4 h-4" /> {ar ? "حذف" : "Delete"}
                </button>
              </div>
            )}
          </div>
        );

      case "filter":
        return (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`relative rounded-xl overflow-hidden border-2 transition-all ${filter === f.key ? "border-white scale-[1.02]" : "border-transparent hover:border-white/30"}`}>
                  <div className="aspect-[3/4] bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-500" style={{ filter: f.css || undefined }} />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center">
                    <span className="text-white text-[11px] font-medium">{f.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "caption":
        return (
          <div className="p-4 space-y-3">
            <label className="text-xs font-medium text-white/70">{ar ? "التعليق" : "Caption"}</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={ar ? "اكتب تعليقاً لهذا الستوري..." : "Write a caption..."}
              className="w-full h-32 bg-white/10 backdrop-blur-sm text-white placeholder-white/30 rounded-xl p-3 text-sm resize-none outline-none border border-white/10 focus:border-white/30 transition-colors"
              maxLength={500}
              dir={ar ? "rtl" : "ltr"}
            />
            <div className="text-right text-xs text-white/30">{caption.length}/500</div>
          </div>
        );
    }
  }, [activeTab, imageScale, brightness, contrast, saturation, filter, caption, ar, activeText, activeSticker, addText, addSticker, removeOverlay, textOverlays, stickerOverlays]);

  /* ═══════ Tabs ═══════ */
  const tabs: { key: EditorTab; icon: React.ReactNode; label: string }[] = [
    { key: "adjust", icon: <LuZoomIn className="w-5 h-5" />, label: ar ? "ضبط" : "Adjust" },
    { key: "filter", icon: <LuSparkles className="w-5 h-5" />, label: ar ? "فلتر" : "Filter" },
    { key: "text", icon: <LuType className="w-5 h-5" />, label: ar ? "نص" : "Text" },
    { key: "sticker", icon: <LuSmile className="w-5 h-5" />, label: ar ? "ملصق" : "Sticker" },
    { key: "caption", icon: <LuMessageSquareText className="w-5 h-5" />, label: ar ? "تعليق" : "Caption" },
  ];

  /* ═══════ Portal render ═══════ */
  const content = (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col md:flex-row select-none">
      {/* ── Header (mobile) ── */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden bg-black/50 backdrop-blur-sm z-10">
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white p-1"><LuX className="w-6 h-6" /></button>
        <span className="text-white font-semibold text-sm">{ar ? "إنشاء ستوري" : "Create Story"}</span>
        <button type="button" onClick={handlePublish} disabled={!file || isPublishing} className="text-white font-semibold text-sm px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-all">
          {isPublishing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : ar ? "نشر" : "Post"}
        </button>
      </div>

      {/* ── Preview area ── */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-6 min-h-0 overflow-hidden">
        <div
          ref={previewRef}
          className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: "9/16", maxHeight: "100%", maxWidth: "100%", width: "auto", height: "100%" }}
          onPointerDown={handleImagePointerDown}
          onWheel={handleWheel}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("[data-overlay]")) {
              setActiveOverlayId(null);
              setEditingTextId(null);
            }
          }}
        >
          {!fileUrl ? (
            /* ── Upload placeholder ── */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/40 transition-all group">
                <LuUpload className="w-12 h-12 text-white/40 group-hover:text-white/70 transition-colors" />
                <span className="text-white/50 group-hover:text-white/80 text-sm font-medium transition-colors">{ar ? "اختر صورة أو فيديو" : "Choose photo or video"}</span>
              </button>
              <p className="text-white/25 text-xs">{ar ? "JPG, PNG, WebP, MP4 — 10MB صور / 50MB فيديو" : "JPG, PNG, WebP, MP4 — 10MB images / 50MB videos"}</p>
            </div>
          ) : (
            <>
              {/* ── Media layers ── */}
              {mediaType === "video" ? (
                <div className="absolute inset-0">
                  {needsBlur && (
                    <div className="absolute inset-0 overflow-hidden">
                      <video src={fileUrl} className="absolute inset-[-20px] w-[calc(100%+40px)] h-[calc(100%+40px)] object-cover blur-[40px] saturate-150 brightness-75" autoPlay playsInline muted loop aria-hidden="true" />
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    src={fileUrl}
                    className={`absolute inset-0 w-full h-full ${fitMode === "cover" ? "object-cover" : "object-contain"}`}
                    style={{
                      filter: filterCSS || undefined,
                      transform: `scale(${imageScale}) translate(${imagePosition.x}%, ${imagePosition.y}%)`,
                      transformOrigin: "center center",
                    }}
                    autoPlay playsInline muted loop
                    onLoadedData={(e) => {
                      const v = e.currentTarget;
                      setNaturalSize({ w: v.videoWidth, h: v.videoHeight });
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0">
                  {needsBlur && (
                    <div className="absolute inset-0 overflow-hidden">
                      <Image src={fileUrl} alt="" fill className="object-cover blur-[40px] saturate-150 brightness-75 scale-110" aria-hidden="true" priority={false} />
                    </div>
                  )}
                  <Image
                    src={fileUrl}
                    alt="Preview"
                    fill
                    className={fitMode === "cover" ? "object-cover" : "object-contain"}
                    style={{
                      filter: filterCSS || undefined,
                      transform: `scale(${imageScale}) translate(${imagePosition.x}%, ${imagePosition.y}%)`,
                      transformOrigin: "center center",
                    }}
                    priority
                    onLoad={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                    }}
                  />
                </div>
              )}

              {/* ── Overlays ── */}
              <div className="absolute inset-0 z-10">
                {textOverlays.map((t) => (
                  <div
                    key={t.id}
                    data-overlay
                    className={`absolute cursor-move touch-none ${activeOverlayId === t.id ? "ring-2 ring-white/60 ring-offset-1 ring-offset-transparent rounded" : ""}`}
                    style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(-50%, -50%) rotate(${t.rotation}deg) scale(${t.scale})` }}
                    onPointerDown={(e) => handleOverlayPointerDown(e, t.id)}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingTextId(t.id); }}
                  >
                    {editingTextId === t.id ? (
                      <input
                        type="text"
                        value={t.text}
                        onChange={(e) => setTextOverlays((p) => p.map((x) => x.id === t.id ? { ...x, text: e.target.value } : x))}
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingTextId(null); }}
                        className="bg-transparent outline-none text-center border-b border-white/50 min-w-[60px]"
                        style={{ fontSize: `${t.fontSize}px`, fontFamily: t.fontFamily, color: t.color }}
                        autoFocus
                        dir={ar ? "rtl" : "ltr"}
                      />
                    ) : (
                      <span className="px-3 py-1.5 whitespace-nowrap select-none" style={{ fontSize: `${t.fontSize}px`, fontFamily: t.fontFamily, color: t.color, backgroundColor: t.backgroundColor, textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>{t.text}</span>
                    )}
                  </div>
                ))}
                {stickerOverlays.map((s) => (
                  <div
                    key={s.id}
                    data-overlay
                    className={`absolute cursor-move touch-none text-5xl ${activeOverlayId === s.id ? "ring-2 ring-white/60 ring-offset-1 ring-offset-transparent rounded" : ""}`}
                    style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})` }}
                    onPointerDown={(e) => handleOverlayPointerDown(e, s.id)}
                  >
                    {s.emoji}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Sidebar (desktop) / Bottom tabs (mobile) ── */}
      <div className="md:w-80 md:h-full flex flex-col bg-black/40 md:bg-black/60 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10">
        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"><LuX className="w-5 h-5" /></button>
          <span className="text-white font-semibold text-sm">{ar ? "إنشاء ستوري" : "Create Story"}</span>
          <button type="button" onClick={handlePublish} disabled={!file || isPublishing} className="text-sm font-semibold px-5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-all flex items-center gap-2">
            {isPublishing ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><LuCheck className="w-4 h-4" /> {ar ? "نشر" : "Post"}</>}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex md:flex-row justify-around md:justify-start md:gap-1 px-2 py-1.5 md:px-3 md:py-2 border-b border-white/5 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-2 px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === t.key ? "text-white bg-white/10" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
              {t.icon}
              <span className="text-[10px] md:text-xs">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[40vh] md:max-h-none">
          {toolPanel}
        </div>

        {/* Error */}
        {publishError && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{publishError}</div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleFileSelect} />
    </div>
  );

  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}
