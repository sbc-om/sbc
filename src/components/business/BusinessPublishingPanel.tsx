"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MarkdownEditor, MarkdownRenderer } from "@/components/ui/MarkdownEditor";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import type { BusinessNews, BusinessProduct } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import type { InstagramPostPreview } from "@/lib/social/instagram";

type PublishPanelProps = {
  businessId: string;
  locale: Locale;
  isOwner?: boolean;
  initialNews: BusinessNews[];
  initialProducts: BusinessProduct[];
  initialInstagramUsername?: string;
  initialInstagramPosts?: InstagramPostPreview[];
  initialInstagramModerationStatus?: "pending" | "approved" | "rejected";
  showComposer?: boolean;
  showContentSections?: boolean;
  hideEmptySections?: boolean;
};

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function formatPrice(price: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    style: "currency",
    currency,
    maximumFractionDigits: 3,
  }).format(price);
}

function moderationLabel(status: "pending" | "approved" | "rejected", ar: boolean): string {
  if (status === "pending") return ar ? "بانتظار مراجعة المشرف" : "Awaiting admin review";
  if (status === "rejected") return ar ? "مرفوض" : "Rejected";
  return ar ? "مقبول" : "Approved";
}

export function BusinessPublishingPanel({
  businessId,
  locale,
  isOwner = false,
  initialNews,
  initialProducts,
  initialInstagramUsername,
  initialInstagramPosts = [],
  initialInstagramModerationStatus = "approved",
  showComposer = true,
  showContentSections = true,
  hideEmptySections = false,
}: PublishPanelProps) {
  const ar = locale === "ar";

  const [newsItems, setNewsItems] = useState<BusinessNews[]>(initialNews);
  const [productItems, setProductItems] = useState<BusinessProduct[]>(initialProducts);

  const [newsLoading, setNewsLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [instagramSaving, setInstagramSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [composerTab, setComposerTab] = useState<"news" | "products" | "instagram">("news");

  const [instagramUsername, setInstagramUsername] = useState(initialInstagramUsername || "");
  const [instagramModerationStatus, setInstagramModerationStatus] = useState<"pending" | "approved" | "rejected">(
    initialInstagramModerationStatus
  );
  const [instagramPosts, setInstagramPosts] = useState<InstagramPostPreview[]>(initialInstagramPosts);
  const [instagramLoading, setInstagramLoading] = useState(false);

  const [newsTitleEn, setNewsTitleEn] = useState("");
  const [newsTitleAr, setNewsTitleAr] = useState("");
  const [newsContentEn, setNewsContentEn] = useState("");
  const [newsContentAr, setNewsContentAr] = useState("");
  const [newsLinkUrl, setNewsLinkUrl] = useState("");
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingNewsTitleEn, setEditingNewsTitleEn] = useState("");
  const [editingNewsTitleAr, setEditingNewsTitleAr] = useState("");
  const [editingNewsContentEn, setEditingNewsContentEn] = useState("");
  const [editingNewsContentAr, setEditingNewsContentAr] = useState("");
  const [editingNewsLinkUrl, setEditingNewsLinkUrl] = useState("");
  const [editingNewsImage, setEditingNewsImage] = useState<File | null>(null);
  const [clearEditingNewsImage, setClearEditingNewsImage] = useState(false);
  const [clearEditingNewsLink, setClearEditingNewsLink] = useState(false);
  const [newsUploadResetKey, setNewsUploadResetKey] = useState(0);
  const [editNewsUploadResetKey, setEditNewsUploadResetKey] = useState(0);

  const [productNameEn, setProductNameEn] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [productDescEn, setProductDescEn] = useState("");
  const [productDescAr, setProductDescAr] = useState("");
  const [productLinkUrl, setProductLinkUrl] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCurrency, setProductCurrency] = useState("OMR");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductNameEn, setEditingProductNameEn] = useState("");
  const [editingProductNameAr, setEditingProductNameAr] = useState("");
  const [editingProductDescEn, setEditingProductDescEn] = useState("");
  const [editingProductDescAr, setEditingProductDescAr] = useState("");
  const [editingProductLinkUrl, setEditingProductLinkUrl] = useState("");
  const [editingProductPrice, setEditingProductPrice] = useState("");
  const [editingProductCurrency, setEditingProductCurrency] = useState("OMR");
  const [editingProductImage, setEditingProductImage] = useState<File | null>(null);
  const [clearEditingProductImage, setClearEditingProductImage] = useState(false);
  const [clearEditingProductLink, setClearEditingProductLink] = useState(false);
  const [productUploadResetKey, setProductUploadResetKey] = useState(0);
  const [editProductUploadResetKey, setEditProductUploadResetKey] = useState(0);

  const editingNewsItem = editingNewsId ? newsItems.find((item) => item.id === editingNewsId) : undefined;
  const editingProductItem = editingProductId ? productItems.find((item) => item.id === editingProductId) : undefined;

  const hasNews = newsItems.length > 0;
  const hasProducts = productItems.length > 0;

  const infoText = useMemo(() => {
    if (!message) return null;
    const isError = message.startsWith("!");
    return (
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          isError
            ? "border-red-300/40 bg-red-500/5 text-red-600"
            : "border-emerald-300/40 bg-emerald-500/5 text-emerald-700"
        }`}
      >
        {isError ? message.slice(1) : message}
      </div>
    );
  }, [message]);

  useEffect(() => {
    let cancelled = false;

    async function loadInstagramPosts() {
      const username = instagramUsername.trim();
      if (!username) {
        if (!cancelled) setInstagramPosts([]);
        return;
      }

      try {
        setInstagramLoading(true);
        const res = await fetch(`/api/instagram/feed?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (!cancelled) {
          setInstagramPosts(Array.isArray(data?.data) ? (data.data as InstagramPostPreview[]) : []);
        }
      } catch {
        if (!cancelled) {
          setInstagramPosts([]);
        }
      } finally {
        if (!cancelled) {
          setInstagramLoading(false);
        }
      }
    }

    if (showContentSections || composerTab === "instagram") {
      void loadInstagramPosts();
    }

    return () => {
      cancelled = true;
    };
  }, [instagramUsername, showContentSections, composerTab]);

  async function saveInstagramProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;

    try {
      setInstagramSaving(true);
      setMessage("");

      const payload = {
        instagramUsername: instagramUsername.trim() ? instagramUsername.trim() : null,
      };

      const res = await fetch(`/api/businesses/${businessId}/instagram`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "تعذر حفظ إعدادات إنستاغرام" : "Failed to save Instagram settings"));
      }

      const nextUsername = String(data?.data?.instagramUsername || "");
      setInstagramUsername(nextUsername);
      const nextStatus = (data?.data?.moderationStatus || "approved") as "pending" | "approved" | "rejected";
      setInstagramModerationStatus(nextStatus);
      setMessage(ar ? "تم حفظ إعدادات إنستاغرام" : "Instagram settings saved");
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "حدث خطأ" : "Something went wrong"}`);
    } finally {
      setInstagramSaving(false);
    }
  }

  async function publishNews(e: React.FormEvent) {
    e.preventDefault();
    setNewsLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("titleEn", newsTitleEn.trim());
      formData.append("titleAr", newsTitleAr.trim());
      formData.append("contentEn", newsContentEn.trim());
      formData.append("contentAr", newsContentAr.trim());
      if (newsLinkUrl.trim()) {
        formData.append("linkUrl", newsLinkUrl.trim());
      }
      if (newsImage) {
        formData.append("image", newsImage);
      }

      const res = await fetch(`/api/businesses/${businessId}/news`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "خطأ في نشر الخبر" : "Failed to publish news"));
      }

      setNewsItems((prev) => [data.data as BusinessNews, ...prev]);
      setNewsTitleEn("");
      setNewsTitleAr("");
      setNewsContentEn("");
      setNewsContentAr("");
      setNewsLinkUrl("");
      setNewsImage(null);
      setNewsUploadResetKey((v) => v + 1);
      setMessage(ar ? "تم إرسال الخبر لمراجعة المشرف" : "News submitted for admin review");
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر النشر" : "Publishing failed"}`);
    } finally {
      setNewsLoading(false);
    }
  }

  async function publishProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("nameEn", productNameEn.trim());
      formData.append("nameAr", productNameAr.trim());
      formData.append("descriptionEn", productDescEn.trim());
      formData.append("descriptionAr", productDescAr.trim());
      if (productLinkUrl.trim()) {
        formData.append("linkUrl", productLinkUrl.trim());
      }
      formData.append("price", productPrice.trim());
      formData.append("currency", productCurrency.trim() || "OMR");
      if (productImage) {
        formData.append("image", productImage);
      }

      const res = await fetch(`/api/businesses/${businessId}/products`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "خطأ في نشر المنتج" : "Failed to publish product"));
      }

      setProductItems((prev) => [data.data as BusinessProduct, ...prev]);
      setProductNameEn("");
      setProductNameAr("");
      setProductDescEn("");
      setProductDescAr("");
      setProductLinkUrl("");
      setProductPrice("");
      setProductCurrency("OMR");
      setProductImage(null);
      setProductUploadResetKey((v) => v + 1);
      setMessage(ar ? "تم إرسال المنتج لمراجعة المشرف" : "Product submitted for admin review");
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر النشر" : "Publishing failed"}`);
    } finally {
      setProductLoading(false);
    }
  }

  async function removeNews(newsId: string) {
    if (!isOwner) return;

    try {
      const res = await fetch(`/api/businesses/${businessId}/news`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setNewsItems((prev) => prev.filter((item) => item.id !== newsId));
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر الحذف" : "Delete failed"}`);
    }
  }

  function startEditNews(item: BusinessNews) {
    setEditingNewsId(item.id);
    setEditingNewsTitleEn(item.title.en);
    setEditingNewsTitleAr(item.title.ar);
    setEditingNewsContentEn(item.content.en);
    setEditingNewsContentAr(item.content.ar);
    setEditingNewsLinkUrl(item.linkUrl || "");
    setEditingNewsImage(null);
    setClearEditingNewsImage(false);
    setClearEditingNewsLink(false);
  }

  async function saveEditNews(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNewsId) return;

    try {
      const formData = new FormData();
      formData.append("newsId", editingNewsId);
      formData.append("titleEn", editingNewsTitleEn);
      formData.append("titleAr", editingNewsTitleAr);
      formData.append("contentEn", editingNewsContentEn);
      formData.append("contentAr", editingNewsContentAr);
      if (editingNewsLinkUrl.trim()) {
        formData.append("linkUrl", editingNewsLinkUrl.trim());
      }
      formData.append("clearLink", clearEditingNewsLink || !editingNewsLinkUrl.trim() ? "true" : "false");
      formData.append("clearImage", clearEditingNewsImage ? "true" : "false");
      if (editingNewsImage) {
        formData.append("image", editingNewsImage);
      }

      const res = await fetch(`/api/businesses/${businessId}/news`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "فشل التحديث" : "Update failed"));
      }

      setNewsItems((prev) => prev.map((item) => (item.id === editingNewsId ? (data.data as BusinessNews) : item)));
      setEditingNewsId(null);
      setEditingNewsImage(null);
      setEditingNewsLinkUrl("");
      setClearEditingNewsImage(false);
      setClearEditingNewsLink(false);
      setEditNewsUploadResetKey((v) => v + 1);
      setMessage(ar ? "تم تحديث الخبر" : "News updated");
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر التحديث" : "Update failed"}`);
    }
  }

  async function toggleNewsPublished(item: BusinessNews) {
    try {
      const res = await fetch(`/api/businesses/${businessId}/news`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: item.id, isPublished: !item.isPublished }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "فشل تغيير الحالة" : "Failed to change status"));
      }

      setNewsItems((prev) => prev.map((x) => (x.id === item.id ? (data.data as BusinessNews) : x)));
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر العملية" : "Operation failed"}`);
    }
  }

  async function removeProduct(productId: string) {
    if (!isOwner) return;

    try {
      const res = await fetch(`/api/businesses/${businessId}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Delete failed");
      }

      setProductItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر الحذف" : "Delete failed"}`);
    }
  }

  function startEditProduct(item: BusinessProduct) {
    setEditingProductId(item.id);
    setEditingProductNameEn(item.name.en);
    setEditingProductNameAr(item.name.ar);
    setEditingProductDescEn(item.description?.en || "");
    setEditingProductDescAr(item.description?.ar || "");
    setEditingProductLinkUrl(item.linkUrl || "");
    setEditingProductPrice(String(item.price));
    setEditingProductCurrency(item.currency || "OMR");
    setEditingProductImage(null);
    setClearEditingProductImage(false);
    setClearEditingProductLink(false);
  }

  async function saveEditProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProductId) return;

    try {
      const formData = new FormData();
      formData.append("productId", editingProductId);
      formData.append("nameEn", editingProductNameEn);
      formData.append("nameAr", editingProductNameAr);
      formData.append("descriptionEn", editingProductDescEn);
      formData.append("descriptionAr", editingProductDescAr);
      if (editingProductLinkUrl.trim()) {
        formData.append("linkUrl", editingProductLinkUrl.trim());
      }
      formData.append("clearLink", clearEditingProductLink || !editingProductLinkUrl.trim() ? "true" : "false");
      formData.append("price", editingProductPrice);
      formData.append("currency", editingProductCurrency);
      formData.append("clearImage", clearEditingProductImage ? "true" : "false");
      if (editingProductImage) {
        formData.append("image", editingProductImage);
      }

      const res = await fetch(`/api/businesses/${businessId}/products`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "فشل التحديث" : "Update failed"));
      }

      setProductItems((prev) =>
        prev.map((item) => (item.id === editingProductId ? (data.data as BusinessProduct) : item))
      );
      setEditingProductId(null);
      setEditingProductImage(null);
      setEditingProductLinkUrl("");
      setClearEditingProductImage(false);
      setClearEditingProductLink(false);
      setEditProductUploadResetKey((v) => v + 1);
      setMessage(ar ? "تم تحديث المنتج" : "Product updated");
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر التحديث" : "Update failed"}`);
    }
  }

  async function toggleProductAvailable(item: BusinessProduct) {
    try {
      const res = await fetch(`/api/businesses/${businessId}/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id, isAvailable: !item.isAvailable }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || (ar ? "فشل تغيير الحالة" : "Failed to change status"));
      }

      setProductItems((prev) => prev.map((x) => (x.id === item.id ? (data.data as BusinessProduct) : x)));
    } catch (error) {
      setMessage(`!${error instanceof Error ? error.message : ar ? "تعذر العملية" : "Operation failed"}`);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {isOwner && showComposer ? (
        <section className="sbc-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {ar ? "النشر الاحترافي" : "Professional Publishing"}
            </h2>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {ar
                ? "انشر أخبار نشاطك ومنتجاتك مباشرة من هذه الصفحة."
                : "Publish business news and products directly from this page."}
            </p>
          </div>

          {infoText}

          <div className="space-y-3">
            <div className="inline-flex rounded-xl border border-(--surface-border) bg-(--chip-bg) p-1">
              <button
                type="button"
                onClick={() => setComposerTab("news")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  composerTab === "news"
                    ? "bg-accent text-accent-foreground"
                    : "text-(--muted-foreground) hover:bg-accent/10"
                }`}
              >
                {ar ? "خبر" : "News"}
              </button>
              <button
                type="button"
                onClick={() => setComposerTab("products")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  composerTab === "products"
                    ? "bg-accent text-accent-foreground"
                    : "text-(--muted-foreground) hover:bg-accent/10"
                }`}
              >
                {ar ? "منتج" : "Product"}
              </button>
              <button
                type="button"
                onClick={() => setComposerTab("instagram")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  composerTab === "instagram"
                    ? "bg-accent text-accent-foreground"
                    : "text-(--muted-foreground) hover:bg-accent/10"
                }`}
              >
                Instagram
              </button>
            </div>

            {composerTab === "news" ? (
              <form onSubmit={publishNews} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 space-y-3">
                <h3 className="text-base font-semibold">{ar ? "نشر خبر" : "Publish News"}</h3>
                <Input
                  value={newsTitleEn}
                  onChange={(e) => setNewsTitleEn(e.target.value)}
                  placeholder={ar ? "عنوان الخبر (EN)" : "News title (EN)"}
                  required
                />
                <Input
                  value={newsTitleAr}
                  onChange={(e) => setNewsTitleAr(e.target.value)}
                  placeholder={ar ? "عنوان الخبر (AR)" : "News title (AR)"}
                  required
                />
                <MarkdownEditor
                  value={newsContentEn}
                  onChange={setNewsContentEn}
                  placeholder={ar ? "محتوى الخبر (EN)" : "News content (EN)"}
                  dir="ltr"
                  height={160}
                  minHeight={120}
                  maxHeight={320}
                />
                <MarkdownEditor
                  value={newsContentAr}
                  onChange={setNewsContentAr}
                  placeholder={ar ? "محتوى الخبر (AR)" : "News content (AR)"}
                  dir="rtl"
                  height={160}
                  minHeight={120}
                  maxHeight={320}
                />
                <Input
                  value={newsLinkUrl}
                  onChange={(e) => setNewsLinkUrl(e.target.value)}
                  placeholder={ar ? "رابط مرتبط (اختياري)" : "Related link (optional)"}
                  type="url"
                />
                <ImageDropzone
                  key={newsUploadResetKey}
                  label={ar ? "صورة الخبر" : "News image"}
                  description={ar ? "اضغط للاختيار أو اسحب الصورة هنا" : "Click to select or drag and drop image"}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  maxSizeMb={6}
                  strings={{
                    clickToSelect: ar ? "اضغط لاختيار الصورة" : "Click to select image",
                    orDragDrop: ar ? "أو اسحبها وأفلتها هنا" : "or drag and drop it here",
                    selected: ar ? "المحدد" : "Selected",
                    current: ar ? "الحالي" : "Current",
                    change: ar ? "تغيير" : "Change",
                    remove: ar ? "إزالة" : "Remove",
                    fileTooLarge: (maxMb) => ar ? `حجم الملف كبير (الحد ${maxMb}MB)` : `File is too large (max ${maxMb}MB)`,
                  }}
                  onFileSelected={(file) => setNewsImage(file)}
                  onFileCleared={() => setNewsImage(null)}
                />
                <Button type="submit" disabled={newsLoading} className="w-full">
                  {newsLoading ? (ar ? "جارٍ النشر..." : "Publishing...") : ar ? "نشر الخبر" : "Publish News"}
                </Button>
              </form>
            ) : composerTab === "products" ? (
              <form onSubmit={publishProduct} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 space-y-3">
                <h3 className="text-base font-semibold">{ar ? "نشر منتج" : "Publish Product"}</h3>
                <Input
                  value={productNameEn}
                  onChange={(e) => setProductNameEn(e.target.value)}
                  placeholder={ar ? "اسم المنتج (EN)" : "Product name (EN)"}
                  required
                />
                <Input
                  value={productNameAr}
                  onChange={(e) => setProductNameAr(e.target.value)}
                  placeholder={ar ? "اسم المنتج (AR)" : "Product name (AR)"}
                  required
                />
                <MarkdownEditor
                  value={productDescEn}
                  onChange={setProductDescEn}
                  placeholder={ar ? "وصف المنتج (EN)" : "Product description (EN)"}
                  dir="ltr"
                  height={160}
                  minHeight={120}
                  maxHeight={320}
                />
                <MarkdownEditor
                  value={productDescAr}
                  onChange={setProductDescAr}
                  placeholder={ar ? "وصف المنتج (AR)" : "Product description (AR)"}
                  dir="rtl"
                  height={160}
                  minHeight={120}
                  maxHeight={320}
                />
                <Input
                  value={productLinkUrl}
                  onChange={(e) => setProductLinkUrl(e.target.value)}
                  placeholder={ar ? "رابط المنتج (اختياري)" : "Product link (optional)"}
                  type="url"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder={ar ? "السعر" : "Price"}
                    type="number"
                    min={0}
                    step="0.001"
                    required
                  />
                  <Input
                    value={productCurrency}
                    onChange={(e) => setProductCurrency(e.target.value.toUpperCase())}
                    placeholder={ar ? "العملة" : "Currency"}
                  />
                </div>
                <ImageDropzone
                  key={productUploadResetKey}
                  label={ar ? "صورة المنتج" : "Product image"}
                  description={ar ? "اضغط للاختيار أو اسحب الصورة هنا" : "Click to select or drag and drop image"}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  maxSizeMb={6}
                  strings={{
                    clickToSelect: ar ? "اضغط لاختيار الصورة" : "Click to select image",
                    orDragDrop: ar ? "أو اسحبها وأفلتها هنا" : "or drag and drop it here",
                    selected: ar ? "المحدد" : "Selected",
                    current: ar ? "الحالي" : "Current",
                    change: ar ? "تغيير" : "Change",
                    remove: ar ? "إزالة" : "Remove",
                    fileTooLarge: (maxMb) => ar ? `حجم الملف كبير (الحد ${maxMb}MB)` : `File is too large (max ${maxMb}MB)`,
                  }}
                  onFileSelected={(file) => setProductImage(file)}
                  onFileCleared={() => setProductImage(null)}
                />
                <Button type="submit" disabled={productLoading} className="w-full">
                  {productLoading ? (ar ? "جارٍ النشر..." : "Publishing...") : ar ? "نشر المنتج" : "Publish Product"}
                </Button>
              </form>
            ) : (
              <form onSubmit={saveInstagramProfile} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 space-y-3">
                <h3 className="text-base font-semibold">{ar ? "ربط إنستاغرام" : "Connect Instagram"}</h3>
                <p className="text-sm text-(--muted-foreground)">
                  {ar
                    ? "أدخل آيدي إنستاغرام (بدون رابط) لعرض أحدث المنشورات تلقائياً أسفل المنتجات."
                    : "Enter your Instagram ID (username) to automatically show latest posts below products."}
                </p>
                <Input
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value.replace(/^@+/, ""))}
                  placeholder={ar ? "instagram_id" : "instagram_id"}
                />
                {instagramUsername.trim() ? (
                  <p className="text-xs text-(--muted-foreground)">
                    {ar ? "حالة المراجعة:" : "Moderation status:"} {moderationLabel(instagramModerationStatus, ar)}
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={instagramSaving}>
                    {instagramSaving ? (ar ? "جارٍ الحفظ..." : "Saving...") : ar ? "حفظ" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setInstagramUsername("")}
                  >
                    {ar ? "مسح" : "Clear"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {showContentSections && (hasNews || !hideEmptySections) ? (
      <section className="sbc-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{ar ? "أخبار النشاط" : "Business News"}</h2>
          <span className="text-xs text-(--muted-foreground)">{newsItems.length}</span>
        </div>

        {!hasNews ? (
          <p className="mt-3 text-sm text-(--muted-foreground)">
            {ar ? "لا توجد أخبار منشورة حالياً." : "No news published yet."}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {newsItems.map((item) => {
              const title = ar ? item.title.ar : item.title.en;
              const content = ar ? item.content.ar : item.content.en;
                const isApproved = item.moderationStatus === "approved";

              return (
                <article key={item.id} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) overflow-hidden">
                  {item.imageUrl ? (
                    <div className="relative h-40 w-full">
                      <Image src={item.imageUrl} alt={title} fill className="object-cover" />
                    </div>
                  ) : null}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold leading-6">{title}</h3>
                      {isOwner ? (
                        <div className="flex items-center gap-3 text-xs">
                          <button type="button" className="hover:underline" onClick={() => startEditNews(item)}>
                            {ar ? "تعديل" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className={`hover:underline ${!isApproved ? "opacity-50 pointer-events-none" : ""}`}
                            onClick={() => toggleNewsPublished(item)}
                          >
                            {item.isPublished ? (ar ? "إخفاء" : "Hide") : ar ? "إظهار" : "Show"}
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => removeNews(item.id)}
                          >
                            {ar ? "حذف" : "Delete"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-(--muted-foreground)">{formatDate(item.createdAt, locale)}</p>
                    <p className="mt-1 text-xs text-(--muted-foreground)">{moderationLabel(item.moderationStatus, ar)}</p>
                    {!item.isPublished ? (
                      <p className="mt-1 text-xs text-amber-600">{ar ? "مخفي حالياً" : "Currently hidden"}</p>
                    ) : null}
                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs text-accent hover:underline"
                      >
                        {ar ? "فتح الرابط" : "Open link"}
                      </a>
                    ) : null}
                    <div className="mt-3 text-sm leading-7 text-foreground">
                      <MarkdownRenderer content={content} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {isOwner && editingNewsId ? (
          <form onSubmit={saveEditNews} className="mt-4 rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 space-y-3">
            <div className="text-sm font-semibold">{ar ? "تعديل الخبر" : "Edit News"}</div>
            <Input value={editingNewsTitleEn} onChange={(e) => setEditingNewsTitleEn(e.target.value)} required />
            <Input value={editingNewsTitleAr} onChange={(e) => setEditingNewsTitleAr(e.target.value)} required />
            <MarkdownEditor
              value={editingNewsContentEn}
              onChange={setEditingNewsContentEn}
              placeholder={ar ? "محتوى الخبر (EN)" : "News content (EN)"}
              dir="ltr"
              height={160}
              minHeight={120}
              maxHeight={320}
            />
            <MarkdownEditor
              value={editingNewsContentAr}
              onChange={setEditingNewsContentAr}
              placeholder={ar ? "محتوى الخبر (AR)" : "News content (AR)"}
              dir="rtl"
              height={160}
              minHeight={120}
              maxHeight={320}
            />
            <Input
              value={editingNewsLinkUrl}
              onChange={(e) => {
                setEditingNewsLinkUrl(e.target.value);
                setClearEditingNewsLink(false);
              }}
              placeholder={ar ? "رابط مرتبط (اختياري)" : "Related link (optional)"}
              type="url"
            />
            <ImageDropzone
              key={`${editNewsUploadResetKey}-${editingNewsId || "none"}`}
              label={ar ? "صورة الخبر" : "News image"}
              description={ar ? "اضغط للاختيار أو اسحب الصورة هنا" : "Click to select or drag and drop image"}
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxSizeMb={6}
              valueUrl={clearEditingNewsImage ? undefined : editingNewsItem?.imageUrl}
              strings={{
                clickToSelect: ar ? "اضغط لاختيار الصورة" : "Click to select image",
                orDragDrop: ar ? "أو اسحبها وأفلتها هنا" : "or drag and drop it here",
                selected: ar ? "المحدد" : "Selected",
                current: ar ? "الحالي" : "Current",
                change: ar ? "تغيير" : "Change",
                remove: ar ? "إزالة" : "Remove",
                fileTooLarge: (maxMb) => ar ? `حجم الملف كبير (الحد ${maxMb}MB)` : `File is too large (max ${maxMb}MB)`,
              }}
              onFileSelected={(file) => {
                setEditingNewsImage(file);
                setClearEditingNewsImage(false);
              }}
              onFileCleared={() => setEditingNewsImage(null)}
              onRemoveExisting={() => {
                setClearEditingNewsImage(true);
                setEditingNewsImage(null);
              }}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">{ar ? "حفظ" : "Save"}</Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingNewsId(null);
                  setEditingNewsImage(null);
                  setEditingNewsLinkUrl("");
                  setClearEditingNewsImage(false);
                  setClearEditingNewsLink(false);
                  setEditNewsUploadResetKey((v) => v + 1);
                }}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </form>
        ) : null}
      </section>
      ) : null}

      {showContentSections && (hasProducts || !hideEmptySections) ? (
      <section className="sbc-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{ar ? "منتجات النشاط" : "Business Products"}</h2>
          <span className="text-xs text-(--muted-foreground)">{productItems.length}</span>
        </div>

        {!hasProducts ? (
          <p className="mt-3 text-sm text-(--muted-foreground)">
            {ar ? "لا توجد منتجات منشورة حالياً." : "No products published yet."}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productItems.map((item) => {
              const name = ar ? item.name.ar : item.name.en;
              const description = item.description ? (ar ? item.description.ar : item.description.en) : "";
                const isApproved = item.moderationStatus === "approved";

              return (
                <article key={item.id} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) overflow-hidden">
                  {item.imageUrl ? (
                    <div className="relative h-40 w-full">
                      <Image src={item.imageUrl} alt={name} fill className="object-cover" />
                    </div>
                  ) : null}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold leading-6">{name}</h3>
                      {isOwner ? (
                        <div className="flex items-center gap-3 text-xs">
                          <button type="button" className="hover:underline" onClick={() => startEditProduct(item)}>
                            {ar ? "تعديل" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className={`hover:underline ${!isApproved ? "opacity-50 pointer-events-none" : ""}`}
                            onClick={() => toggleProductAvailable(item)}
                          >
                            {item.isAvailable ? (ar ? "إخفاء" : "Hide") : ar ? "إظهار" : "Show"}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => removeProduct(item.id)}
                          >
                            {ar ? "حذف" : "Delete"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {!item.isAvailable ? (
                      <p className="mt-1 text-xs text-amber-600">{ar ? "غير متاح حالياً" : "Currently unavailable"}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-(--muted-foreground)">{moderationLabel(item.moderationStatus, ar)}</p>

                    {description ? (
                      <p className="mt-2 text-sm text-(--muted-foreground) line-clamp-3">{description}</p>
                    ) : null}

                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs text-accent hover:underline"
                      >
                        {ar ? "فتح الرابط" : "Open link"}
                      </a>
                    ) : null}

                    <p className="mt-3 text-sm font-semibold text-accent">
                      {formatPrice(item.price, item.currency, locale)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {isOwner && editingProductId ? (
          <form onSubmit={saveEditProduct} className="mt-4 rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 space-y-3">
            <div className="text-sm font-semibold">{ar ? "تعديل المنتج" : "Edit Product"}</div>
            <Input value={editingProductNameEn} onChange={(e) => setEditingProductNameEn(e.target.value)} required />
            <Input value={editingProductNameAr} onChange={(e) => setEditingProductNameAr(e.target.value)} required />
            <MarkdownEditor
              value={editingProductDescEn}
              onChange={setEditingProductDescEn}
              placeholder={ar ? "وصف المنتج (EN)" : "Product description (EN)"}
              dir="ltr"
              height={160}
              minHeight={120}
              maxHeight={320}
            />
            <MarkdownEditor
              value={editingProductDescAr}
              onChange={setEditingProductDescAr}
              placeholder={ar ? "وصف المنتج (AR)" : "Product description (AR)"}
              dir="rtl"
              height={160}
              minHeight={120}
              maxHeight={320}
            />
            <Input
              value={editingProductLinkUrl}
              onChange={(e) => {
                setEditingProductLinkUrl(e.target.value);
                setClearEditingProductLink(false);
              }}
              placeholder={ar ? "رابط المنتج (اختياري)" : "Product link (optional)"}
              type="url"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                step="0.001"
                value={editingProductPrice}
                onChange={(e) => setEditingProductPrice(e.target.value)}
                required
              />
              <Input value={editingProductCurrency} onChange={(e) => setEditingProductCurrency(e.target.value.toUpperCase())} required />
            </div>
            <ImageDropzone
              key={`${editProductUploadResetKey}-${editingProductId || "none"}`}
              label={ar ? "صورة المنتج" : "Product image"}
              description={ar ? "اضغط للاختيار أو اسحب الصورة هنا" : "Click to select or drag and drop image"}
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxSizeMb={6}
              valueUrl={clearEditingProductImage ? undefined : editingProductItem?.imageUrl}
              strings={{
                clickToSelect: ar ? "اضغط لاختيار الصورة" : "Click to select image",
                orDragDrop: ar ? "أو اسحبها وأفلتها هنا" : "or drag and drop it here",
                selected: ar ? "المحدد" : "Selected",
                current: ar ? "الحالي" : "Current",
                change: ar ? "تغيير" : "Change",
                remove: ar ? "إزالة" : "Remove",
                fileTooLarge: (maxMb) => ar ? `حجم الملف كبير (الحد ${maxMb}MB)` : `File is too large (max ${maxMb}MB)`,
              }}
              onFileSelected={(file) => {
                setEditingProductImage(file);
                setClearEditingProductImage(false);
              }}
              onFileCleared={() => setEditingProductImage(null)}
              onRemoveExisting={() => {
                setClearEditingProductImage(true);
                setEditingProductImage(null);
              }}
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm">{ar ? "حفظ" : "Save"}</Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingProductId(null);
                  setEditingProductImage(null);
                  setEditingProductLinkUrl("");
                  setClearEditingProductImage(false);
                  setClearEditingProductLink(false);
                  setEditProductUploadResetKey((v) => v + 1);
                }}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </form>
        ) : null}
      </section>
      ) : null}

      {showContentSections && instagramUsername.trim() && (isOwner || instagramModerationStatus === "approved") ? (
      <section className="sbc-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Instagram</h2>
          <a
            href={`https://www.instagram.com/${instagramUsername.replace(/^@/, "")}/`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:underline"
          >
            @{instagramUsername.replace(/^@/, "")}
          </a>
        </div>

        {instagramLoading ? (
          <p className="mt-3 text-sm text-(--muted-foreground)">{ar ? "جارٍ تحميل المنشورات..." : "Loading posts..."}</p>
        ) : instagramPosts.length === 0 ? (
          <p className="mt-3 text-sm text-(--muted-foreground)">
            {ar ? "لا توجد منشورات متاحة حالياً لهذا الحساب." : "No Instagram posts available for this profile yet."}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {instagramPosts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-xl border border-(--surface-border) bg-(--chip-bg)"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  {post.thumbnailUrl ? (
                    <Image
                      src={`/api/instagram/image?url=${encodeURIComponent(post.thumbnailUrl)}&label=${encodeURIComponent(post.caption || "Instagram post")}`}
                      alt={post.caption || "Instagram post"}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-(--muted-foreground)">
                      Instagram
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
      ) : null}
    </div>
  );
}
