"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { LuZoomIn, LuType, LuSmile, LuSparkles, LuMessageSquareText, LuRefreshCw } from "react-icons/lu";

import type { Locale } from "@/lib/i18n/locales";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

interface StoryEditorProps {
  businessId: string;
  locale: Locale;
  onClose: () => void;
  onStoryCreated?: () => void;
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

type ActiveTool = "none" | "caption" | "text" | "stickers" | "draw" | "filters" | "crop" | "transform";

type FilterType = "none" | "grayscale" | "sepia" | "warm" | "cool" | "vintage" | "dramatic" | "fade" | "vivid";

/* ─────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────── */

const FONTS = [
  { id: "sans", name: "Sans", family: "system-ui, sans-serif" },
  { id: "serif", name: "Serif", family: "Georgia, serif" },
  { id: "mono", name: "Mono", family: "monospace" },
  { id: "cursive", name: "Cursive", family: "cursive" },
  { id: "bold", name: "Bold", family: "system-ui, sans-serif", weight: "900" },
];

const COLORS = [
  "#FFFFFF", "#000000", "#FF0000", "#FF6B00", "#FFD700",
  "#00FF00", "#00D4FF", "#0066FF", "#8B00FF", "#FF00FF",
  "#FF69B4", "#00CED1", "#32CD32", "#FF4500", "#1E90FF",
];

const BG_COLORS = [
  "transparent", "#00000080", "#FFFFFF80", "#FF000080",
  "#00FF0080", "#0000FF80", "#FFD70080", "#FF00FF80",
];

const STICKERS = [
  "❤️", "🔥", "😍", "🎉", "✨", "💯", "🙌", "👏",
  "😂", "🥺", "😎", "🤩", "💪", "🎯", "🚀", "💡",
  "⭐", "🌟", "💫", "🎁", "🏆", "👑", "💎", "🌈",
  "☀️", "🌙", "⚡", "💥", "❄️", "🔔", "📍", "💬",
];

const FILTERS: { id: FilterType; name: string; style: string }[] = [
  { id: "none", name: "Original", style: "" },
  { id: "grayscale", name: "B&W", style: "grayscale(100%)" },
  { id: "sepia", name: "Sepia", style: "sepia(80%)" },
  { id: "warm", name: "Warm", style: "saturate(1.3) sepia(20%) brightness(1.1)" },
  { id: "cool", name: "Cool", style: "saturate(1.1) hue-rotate(10deg) brightness(1.05)" },
  { id: "vintage", name: "Vintage", style: "sepia(30%) contrast(1.1) brightness(0.95)" },
  { id: "dramatic", name: "Drama", style: "contrast(1.4) saturate(1.2) brightness(0.9)" },
  { id: "fade", name: "Fade", style: "contrast(0.9) brightness(1.1) saturate(0.8)" },
  { id: "vivid", name: "Vivid", style: "saturate(1.5) contrast(1.1)" },
];

/* ─────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────── */

export function StoryEditor({ businessId, locale, onClose, onStoryCreated }: StoryEditorProps) {
  const ar = locale === "ar";
  const router = useRouter();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });
  
  // Editor state
  const [activeTool, setActiveTool] = useState<ActiveTool>("none");
  const [activeFilter, setActiveFilter] = useState<FilterType>("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  
  // Text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [newTextInput, setNewTextInput] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textBgColor, setTextBgColor] = useState("transparent");
  const [textFont, setTextFont] = useState(FONTS[0].family);
  const [textSize, setTextSize] = useState(32);
  
  // Caption
  const [caption, setCaption] = useState("");
  
  // Image transform (zoom & pan)
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ─────────────────────────────────────────────────────────────
     File handling
     ───────────────────────────────────────────────────────────── */

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError(ar ? "نوع الملف غير مدعوم" : "Unsupported file type");
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(ar 
        ? `حجم الملف كبير جداً. الحد الأقصى ${isVideo ? "50" : "10"} ميجابايت`
        : `File too large. Max ${isVideo ? "50MB" : "10MB"}`
      );
      return;
    }

    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setMediaType(isVideo ? "video" : "image");
  }, [ar]);

  const handleMediaLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el instanceof HTMLImageElement) {
      setMediaDimensions({ width: el.naturalWidth, height: el.naturalHeight });
    } else if (el instanceof HTMLVideoElement) {
      setMediaDimensions({ width: el.videoWidth, height: el.videoHeight });
    }
  }, []);

  /* ─────────────────────────────────────────────────────────────
     Text overlay
     ───────────────────────────────────────────────────────────── */

  const addTextOverlay = useCallback(() => {
    if (!newTextInput.trim()) return;
    
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text: newTextInput,
      x: 50,
      y: 50,
      fontSize: textSize,
      fontFamily: textFont,
      color: textColor,
      backgroundColor: textBgColor,
      rotation: 0,
      scale: 1,
    };
    
    setTextOverlays((prev) => [...prev, newText]);
    setNewTextInput("");
    setSelectedOverlayId(newText.id);
    setActiveTool("none");
  }, [newTextInput, textSize, textFont, textColor, textBgColor]);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTextOverlay = useCallback((id: string) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  }, [selectedOverlayId]);

  /* ─────────────────────────────────────────────────────────────
     Sticker overlay
     ───────────────────────────────────────────────────────────── */

  const addSticker = useCallback((emoji: string) => {
    const newSticker: StickerOverlay = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    };
    
    setStickerOverlays((prev) => [...prev, newSticker]);
    setSelectedOverlayId(newSticker.id);
    setActiveTool("none");
  }, []);

  const updateSticker = useCallback((id: string, updates: Partial<StickerOverlay>) => {
    setStickerOverlays((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteSticker = useCallback((id: string) => {
    setStickerOverlays((prev) => prev.filter((s) => s.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  }, [selectedOverlayId]);

  /* ─────────────────────────────────────────────────────────────
     Drag handling
     ───────────────────────────────────────────────────────────── */

  const handleOverlayDrag = useCallback((
    id: string,
    type: "text" | "sticker",
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlayId(id);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const item = type === "text" 
      ? textOverlays.find((t) => t.id === id)
      : stickerOverlays.find((s) => s.id === id);
    
    if (!item) return;

    const startPosX = item.x;
    const startPosY = item.y;

    const handleMove = (moveE: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveE ? moveE.touches[0].clientX : moveE.clientX;
      const clientY = "touches" in moveE ? moveE.touches[0].clientY : moveE.clientY;

      const deltaX = ((clientX - startX) / rect.width) * 100;
      const deltaY = ((clientY - startY) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100, startPosX + deltaX));
      const newY = Math.max(0, Math.min(100, startPosY + deltaY));

      if (type === "text") {
        updateTextOverlay(id, { x: newX, y: newY });
      } else {
        updateSticker(id, { x: newX, y: newY });
      }
    };

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
  }, [textOverlays, stickerOverlays, updateTextOverlay, updateSticker]);

  /* ─────────────────────────────────────────────────────────────
     Image drag (pan) handling
     ───────────────────────────────────────────────────────────── */

  const handleImageDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (mediaType === "video") return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);

    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startPosX = imagePosition.x;
    const startPosY = imagePosition.y;

    const handleMove = (moveE: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveE ? moveE.touches[0].clientX : moveE.clientX;
      const clientY = "touches" in moveE ? moveE.touches[0].clientY : moveE.clientY;

      // Convert pixel delta to percentage (scaled by current zoom)
      const sensitivity = 0.3 / imageScale;
      const deltaX = (clientX - startX) * sensitivity;
      const deltaY = (clientY - startY) * sensitivity;

      // Allow panning - more when zoomed in
      const maxPan = 50;
      const newX = Math.max(-maxPan, Math.min(maxPan, startPosX + deltaX));
      const newY = Math.max(-maxPan, Math.min(maxPan, startPosY + deltaY));

      setImagePosition({ x: newX, y: newY });
    };

    const handleUp = () => {
      setIsDraggingImage(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
  }, [mediaType, imagePosition, imageScale]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (mediaType === "video") return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setImageScale((prev) => Math.max(0.5, Math.min(10, prev + delta)));
  }, [mediaType]);

  const resetImageTransform = useCallback(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  /* ─────────────────────────────────────────────────────────────
     Render to canvas and upload
     ───────────────────────────────────────────────────────────── */

  const renderToCanvas = useCallback(async (): Promise<Blob | null> => {
    if (!mediaUrl || mediaType === "video") return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Story dimensions (9:16)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Load and draw image
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = mediaUrl;
    });

    // Apply filters
    const filterStyle = FILTERS.find((f) => f.id === activeFilter)?.style || "";
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.filter = `${filterStyle} ${adjustments}`.trim() || "none";

    // Draw image with zoom and pan
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    
    // Calculate base crop
    let baseW = img.width;
    let baseH = img.height;
    let baseX = 0;
    let baseY = 0;
    
    if (imgRatio > canvasRatio) {
      baseW = img.height * canvasRatio;
      baseX = (img.width - baseW) / 2;
    } else {
      baseH = img.width / canvasRatio;
      baseY = (img.height - baseH) / 2;
    }
    
    // Apply zoom (scale reduces the source area)
    const scaledW = baseW / imageScale;
    const scaledH = baseH / imageScale;
    
    // Apply pan (offset within the zoomed area)
    const panFactorX = (imagePosition.x / 100) * scaledW;
    const panFactorY = (imagePosition.y / 100) * scaledH;
    
    const sx = baseX + (baseW - scaledW) / 2 - panFactorX;
    const sy = baseY + (baseH - scaledH) / 2 - panFactorY;

    ctx.drawImage(img, sx, sy, scaledW, scaledH, 0, 0, width, height);
    ctx.filter = "none";

    // Draw text overlays
    for (const text of textOverlays) {
      const x = (text.x / 100) * width;
      const y = (text.y / 100) * height;
      const fontSize = text.fontSize * (width / 400);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((text.rotation * Math.PI) / 180);
      ctx.scale(text.scale, text.scale);

      ctx.font = `${fontSize}px ${text.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Background
      if (text.backgroundColor !== "transparent") {
        const metrics = ctx.measureText(text.text);
        const padding = fontSize * 0.3;
        ctx.fillStyle = text.backgroundColor;
        ctx.fillRect(
          -metrics.width / 2 - padding,
          -fontSize / 2 - padding / 2,
          metrics.width + padding * 2,
          fontSize + padding
        );
      }

      // Text shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = text.color;
      ctx.fillText(text.text, 0, 0);
      ctx.restore();
    }

    // Draw stickers
    for (const sticker of stickerOverlays) {
      const x = (sticker.x / 100) * width;
      const y = (sticker.y / 100) * height;
      const fontSize = 80 * sticker.scale * (width / 400);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sticker.emoji, 0, 0);
      ctx.restore();
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }, [mediaUrl, mediaType, activeFilter, brightness, contrast, saturation, textOverlays, stickerOverlays, imageScale, imagePosition]);

  const handlePublish = useCallback(async () => {
    if (!mediaFile) return;

    setIsUploading(true);
    setError(null);

    try {
      let fileToUpload: File | Blob = mediaFile;

      // If image with overlays or transforms, render to canvas
      if (mediaType === "image" && (textOverlays.length > 0 || stickerOverlays.length > 0 || activeFilter !== "none" || brightness !== 100 || contrast !== 100 || saturation !== 100 || imageScale !== 1 || imagePosition.x !== 0 || imagePosition.y !== 0)) {
        const blob = await renderToCanvas();
        if (blob) {
          fileToUpload = new File([blob], "story.jpg", { type: "image/jpeg" });
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("mediaType", mediaType);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const res = await fetch(`/api/businesses/${businessId}/stories`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      router.refresh();
      onStoryCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, [mediaFile, mediaType, textOverlays, stickerOverlays, activeFilter, brightness, contrast, saturation, caption, businessId, router, onStoryCreated, onClose, renderToCanvas, imageScale, imagePosition]);

  /* ─────────────────────────────────────────────────────────────
     Filter style
     ───────────────────────────────────────────────────────────── */

  const getFilterStyle = useCallback(() => {
    const filterStyle = FILTERS.find((f) => f.id === activeFilter)?.style || "";
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return `${filterStyle} ${adjustments}`.trim();
  }, [activeFilter, brightness, contrast, saturation]);

  /* ─────────────────────────────────────────────────────────────
     Keyboard
     ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeTool !== "none") {
          setActiveTool("none");
        } else if (selectedOverlayId) {
          setSelectedOverlayId(null);
        } else {
          onClose();
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedOverlayId && !editingTextId) {
          if (selectedOverlayId.startsWith("text-")) {
            deleteTextOverlay(selectedOverlayId);
          } else {
            deleteSticker(selectedOverlayId);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTool, selectedOverlayId, editingTextId, onClose, deleteTextOverlay, deleteSticker]);

  /* ─────────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────────── */

  if (!mounted) return null;

  const toolContent = (
    <>
      {activeTool === "transform" && (
        <div className="space-y-4">
          <p className="text-white/60 text-sm text-center">
            {ar ? "عکس را درگ کنید یا از اسلایدرها استفاده کنید" : "Drag the image or use the sliders"}
          </p>
          <div>
            <label className="text-white/60 text-sm flex items-center justify-between">
              <span>{ar ? "بزرگنمایی" : "Zoom"}</span>
              <span className="text-white">{Math.round(imageScale * 100)}%</span>
            </label>
            <input type="range" min="50" max="1000" value={imageScale * 100} onChange={(e) => setImageScale(Number(e.target.value) / 100)} className="w-full mt-2" />
          </div>
          <div>
            <label className="text-white/60 text-sm flex items-center justify-between">
              <span>{ar ? "موقعیت افقی" : "Position X"}</span>
              <span className="text-white">{Math.round(imagePosition.x)}%</span>
            </label>
            <input type="range" min="-50" max="50" value={imagePosition.x} onChange={(e) => setImagePosition(prev => ({ ...prev, x: Number(e.target.value) }))} className="w-full mt-2" />
          </div>
          <div>
            <label className="text-white/60 text-sm flex items-center justify-between">
              <span>{ar ? "موقعیت عمودی" : "Position Y"}</span>
              <span className="text-white">{Math.round(imagePosition.y)}%</span>
            </label>
            <input type="range" min="-50" max="50" value={imagePosition.y} onChange={(e) => setImagePosition(prev => ({ ...prev, y: Number(e.target.value) }))} className="w-full mt-2" />
          </div>
          <button type="button" onClick={resetImageTransform} className="w-full bg-white/10 text-white rounded-xl py-2.5 font-medium hover:bg-white/20 transition-colors">
            {ar ? "بازنشانی" : "Reset"}
          </button>
          <div className="pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              {ar ? "💡 اسکرول = زوم، درگ = جابجایی" : "💡 Scroll = zoom, drag = pan"}
            </p>
          </div>
        </div>
      )}

      {activeTool === "text" && (
        <div className="space-y-4">
          <div>
            <input type="text" value={newTextInput} onChange={(e) => setNewTextInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTextOverlay()} placeholder={ar ? "اكتب نصاً..." : "Type text..."} className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-white/40" />
            <button type="button" onClick={addTextOverlay} disabled={!newTextInput.trim()} className="w-full mt-2 bg-white text-black rounded-xl py-2.5 font-medium disabled:opacity-50">
              {ar ? "إضافة نص" : "Add Text"}
            </button>
          </div>
          <div>
            <label className="text-white/60 text-sm">{ar ? "حجم الخط" : "Font Size"}</label>
            <input type="range" min="16" max="72" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full mt-2" />
          </div>
          <div>
            <label className="text-white/60 text-sm">{ar ? "الخط" : "Font"}</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {FONTS.map((font) => (
                <button key={font.id} type="button" onClick={() => setTextFont(font.family)} className={`px-3 py-2 rounded-lg text-sm transition-colors ${textFont === font.family ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`} style={{ fontFamily: font.family }}>
                  {font.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-white/60 text-sm">{ar ? "لون النص" : "Text Color"}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setTextColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform ${textColor === color ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-white/60 text-sm">{ar ? "خلفية النص" : "Background"}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {BG_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setTextBgColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform ${textBgColor === color ? "border-white scale-110" : "border-white/30"}`} style={{ backgroundColor: color === "transparent" ? "transparent" : color }}>
                  {color === "transparent" && (
                    <svg className="w-full h-full text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTool === "stickers" && (
        <div className="grid grid-cols-6 gap-2">
          {STICKERS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => addSticker(emoji)} className="text-3xl p-2 hover:bg-white/10 rounded-lg transition-colors">
              {emoji}
            </button>
          ))}
        </div>
      )}

      {activeTool === "filters" && (
        <div className="space-y-6">
          <div>
            <label className="text-white/60 text-sm mb-3 block">{ar ? "الفلاتر" : "Filters"}</label>
            <div className="grid grid-cols-3 gap-2">
              {FILTERS.map((filter) => (
                <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={`rounded-xl overflow-hidden border-2 transition-all ${activeFilter === filter.id ? "border-white" : "border-transparent"}`}>
                  <div className="aspect-square relative">
                    {mediaUrl && <img src={mediaUrl} alt={filter.name} className="w-full h-full object-cover" style={{ filter: filter.style || "none" }} />}
                  </div>
                  <div className="py-1.5 text-center text-xs text-white bg-black/50">{filter.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/60">{ar ? "السطوع" : "Brightness"}</span><span className="text-white">{brightness}%</span></div>
              <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/60">{ar ? "التباين" : "Contrast"}</span><span className="text-white">{contrast}%</span></div>
              <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2"><span className="text-white/60">{ar ? "التشبع" : "Saturation"}</span><span className="text-white">{saturation}%</span></div>
              <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {(activeTool === "none" || activeTool === "caption") && (
        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-sm">{ar ? "کپشن" : "Caption"}</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={ar ? "کپشن بنویسید..." : "Add a caption..."} maxLength={500} rows={3} className="w-full mt-2 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-white/40 resize-none" />
            <div className="text-white/40 text-xs text-end mt-1">{caption.length}/500</div>
          </div>
          <div className="hidden md:block pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm mb-3">{ar ? "ابزار سریع" : "Quick Tools"}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setActiveTool("text")} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 transition-colors"><LuType className="w-5 h-5" /><span className="text-sm">{ar ? "متن" : "Add Text"}</span></button>
              <button type="button" onClick={() => setActiveTool("stickers")} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 transition-colors"><LuSmile className="w-5 h-5" /><span className="text-sm">{ar ? "استیکر" : "Stickers"}</span></button>
              <button type="button" onClick={() => setActiveTool("filters")} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 transition-colors"><LuSparkles className="w-5 h-5" /><span className="text-sm">{ar ? "فیلتر" : "Filters"}</span></button>
              <button type="button" onClick={() => { setMediaFile(null); setMediaUrl(null); setTextOverlays([]); setStickerOverlays([]); setActiveFilter("none"); setBrightness(100); setContrast(100); setSaturation(100); }} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 transition-colors"><LuRefreshCw className="w-5 h-5" /><span className="text-sm">{ar ? "تغییر عکس" : "Change"}</span></button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const editorContent = (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-10 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white p-2 -m-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-white font-semibold">
          {ar ? "إنشاء ستوري" : "Create Story"}
        </h2>

        {mediaUrl && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isUploading}
            className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-all"
          >
            {isUploading ? (ar ? "جارٍ النشر..." : "Posting...") : (ar ? "نشر" : "Post")}
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Canvas area - full height */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-6 relative">
          {!mediaUrl ? (
            /* Upload area */
            <div className="w-full max-w-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[9/16] rounded-2xl border-2 border-dashed border-white/30 hover:border-white/50 transition-colors flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">{ar ? "اختر صورة أو فيديو" : "Choose photo or video"}</p>
                  <p className="text-white/50 text-sm mt-1">{ar ? "أو اسحب وأفلت هنا" : "or drag and drop here"}</p>
                </div>
              </button>
            </div>
          ) : (
            /* Preview with overlays */
            <div className="relative flex items-center justify-center">
              {/* Story frame container - fixed 9:16 aspect ratio */}
              <div
                ref={containerRef}
                className={`relative w-[340px] md:w-[380px] aspect-[9/16] rounded-2xl overflow-hidden bg-black cursor-grab ${isDraggingImage ? "cursor-grabbing" : ""}`}
                onMouseDown={mediaType === "image" ? handleImageDragStart : undefined}
                onTouchStart={mediaType === "image" ? handleImageDragStart : undefined}
                onWheel={handleWheel}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedOverlayId(null);
                }}
              >
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    style={{ filter: getFilterStyle() }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedMetadata={handleMediaLoad}
                  />
                ) : (
                  <img
                    ref={imageRef}
                    src={mediaUrl}
                    alt="Preview"
                    className="absolute w-full h-full object-contain select-none"
                    style={{ 
                      filter: getFilterStyle(),
                      transform: `scale(${imageScale}) translate(${imagePosition.x}%, ${imagePosition.y}%)`,
                      transformOrigin: "center center",
                    }}
                    onLoad={handleMediaLoad}
                    draggable={false}
                  />
                )}

              {/* Text overlays */}
              {textOverlays.map((text) => (
                <div
                  key={text.id}
                  className={`absolute cursor-move transition-shadow ${selectedOverlayId === text.id ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""}`}
                  style={{
                    left: `${text.x}%`,
                    top: `${text.y}%`,
                    transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
                  }}
                  onMouseDown={(e) => handleOverlayDrag(text.id, "text", e)}
                  onTouchStart={(e) => handleOverlayDrag(text.id, "text", e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOverlayId(text.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTextId(text.id);
                  }}
                >
                  <span
                    className="px-3 py-1.5 whitespace-nowrap"
                    style={{
                      fontSize: `${text.fontSize}px`,
                      fontFamily: text.fontFamily,
                      color: text.color,
                      backgroundColor: text.backgroundColor,
                      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {text.text}
                  </span>
                  {selectedOverlayId === text.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTextOverlay(text.id);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Sticker overlays */}
              {stickerOverlays.map((sticker) => (
                <div
                  key={sticker.id}
                  className={`absolute cursor-move text-5xl transition-shadow ${selectedOverlayId === sticker.id ? "ring-2 ring-white ring-offset-2 ring-offset-transparent rounded-lg" : ""}`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                  }}
                  onMouseDown={(e) => handleOverlayDrag(sticker.id, "sticker", e)}
                  onTouchStart={(e) => handleOverlayDrag(sticker.id, "sticker", e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOverlayId(sticker.id);
                  }}
                >
                  {sticker.emoji}
                  {selectedOverlayId === sticker.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSticker(sticker.id);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        {mediaUrl && (
          <div className="hidden md:flex md:w-80 bg-gradient-to-l from-black/90 to-black/70 backdrop-blur-md border-l border-white/10 flex-col">
            <div className="flex-shrink-0 flex border-b border-white/10 bg-black/50">
              {[
                { id: "transform" as const, icon: <LuZoomIn className="w-5 h-5 mx-auto" />, label: ar ? "اندازه" : "Size" },
                { id: "text" as const, icon: <LuType className="w-5 h-5 mx-auto" />, label: ar ? "متن" : "Text" },
                { id: "stickers" as const, icon: <LuSmile className="w-5 h-5 mx-auto" />, label: ar ? "استیکر" : "Stickers" },
                { id: "filters" as const, icon: <LuSparkles className="w-5 h-5 mx-auto" />, label: ar ? "فیلتر" : "Filters" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(activeTool === tool.id ? "none" : tool.id)}
                  className={`flex-1 px-3 py-3 text-center transition-all ${activeTool === tool.id ? "bg-white/15 text-white border-b-2 border-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="block text-xs mt-0.5 font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              {toolContent}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: bottom tab bar + popup panel */}
      {mediaUrl && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
          {/* Slide-up tool panel */}
          {activeTool !== "none" && (
            <div className="bg-black/95 backdrop-blur-xl border-t border-white/15 rounded-t-3xl max-h-[55vh] flex flex-col" style={{ animation: "slideUp 0.25s ease-out" }}>
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-white/80 text-sm font-semibold">
                  {activeTool === "caption" && (ar ? "کپشن" : "Caption")}
                  {activeTool === "transform" && (ar ? "اندازه" : "Size")}
                  {activeTool === "text" && (ar ? "متن" : "Text")}
                  {activeTool === "stickers" && (ar ? "استیکر" : "Stickers")}
                  {activeTool === "filters" && (ar ? "فیلتر" : "Filters")}
                </span>
                <button type="button" onClick={() => setActiveTool("none")} className="text-white/60 hover:text-white p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {toolContent}
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex bg-black/95 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {[
              { id: "caption" as const, icon: <LuMessageSquareText className="w-5 h-5 mx-auto" />, label: ar ? "کپشن" : "Caption" },
              { id: "transform" as const, icon: <LuZoomIn className="w-5 h-5 mx-auto" />, label: ar ? "اندازه" : "Size" },
              { id: "text" as const, icon: <LuType className="w-5 h-5 mx-auto" />, label: ar ? "متن" : "Text" },
              { id: "stickers" as const, icon: <LuSmile className="w-5 h-5 mx-auto" />, label: ar ? "استیکر" : "Stickers" },
              { id: "filters" as const, icon: <LuSparkles className="w-5 h-5 mx-auto" />, label: ar ? "فیلتر" : "Filters" },
            ].map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(activeTool === tool.id ? "none" : tool.id)}
                className={`flex-1 py-2.5 text-center transition-all ${activeTool === tool.id ? "text-white" : "text-white/45"}`}
              >
                <span className="block">{tool.icon}</span>
                <span className="text-[9px] block mt-0.5 font-medium">{tool.label}</span>
                {activeTool === tool.id && <div className="w-5 h-0.5 bg-white rounded-full mx-auto mt-1" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl z-40">
          {error}
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          background: rgba(255,255,255,0.2);
          height: 4px;
          border-radius: 2px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          margin-top: -6px;
          background: white;
          height: 16px;
          width: 16px;
          border-radius: 50%;
        }
        input[type="range"]::-moz-range-track {
          background: rgba(255,255,255,0.2);
          height: 4px;
          border-radius: 2px;
        }
        input[type="range"]::-moz-range-thumb {
          background: white;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );

  return createPortal(editorContent, document.body);
}
