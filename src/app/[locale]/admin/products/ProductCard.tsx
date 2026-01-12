"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { StoreProduct } from "@/lib/db/products";
import type { Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function ProductCard({
  product,
  locale,
}: {
  product: StoreProduct;
  locale: Locale;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(product);

  const programLabels: Record<string, { en: string; ar: string }> = {
    directory: { en: "Business Directory", ar: "دليل الأعمال" },
    loyalty: { en: "Loyalty System", ar: "نظام الولاء" },
    marketing: { en: "Marketing Platform", ar: "منصة التسويق" },
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      router.refresh();
    } catch (err) {
      alert(ar ? "فشل تغيير الحالة" : "Failed to toggle status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(ar ? "هل تريد حذف هذا المنتج؟" : "Delete this product?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (err) {
      alert(ar ? "فشل الحذف" : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditing(false);
      router.refresh();
    } catch (err) {
      alert(ar ? "فشل التحديث" : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const programLabel = programLabels[product.program] || { en: product.program, ar: product.program };

  if (editing) {
    return (
      <div className="sbc-card p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "اسم المنتج (EN)" : "Product Name (EN)"}
            </label>
            <Input
              value={formData.name.en}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "اسم المنتج (AR)" : "Product Name (AR)"}
            </label>
            <Input
              value={formData.name.ar}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "الوصف (EN)" : "Description (EN)"}
            </label>
            <Textarea
              value={formData.description.en}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "الوصف (AR)" : "Description (AR)"}
            </label>
            <Textarea
              value={formData.description.ar}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ar: e.target.value } })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "السعر" : "Price"}
              </label>
              <Input
                type="number"
                value={formData.price.amount}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price, amount: Number(e.target.value) } })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "المدة (أيام)" : "Duration (days)"}
              </label>
              <Input
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={loading} size="sm">
              {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
            </Button>
            <Button onClick={() => setEditing(false)} variant="ghost" size="sm">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sbc-card p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">
              {ar ? product.name.ar : product.name.en}
            </h3>
            {!product.isActive && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                {ar ? "معطل" : "Inactive"}
              </span>
            )}
          </div>
          <p className="text-sm text-(--muted-foreground)">
            {ar ? programLabel.ar : programLabel.en}
          </p>
        </div>
        {product.badges && product.badges.length > 0 && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-accent text-(--accent-foreground)">
            {product.badges[0]}
          </span>
        )}
      </div>

      <p className="text-sm text-(--muted-foreground) mb-4">
        {ar ? product.description.ar : product.description.en}
      </p>

      <div className="mb-4">
        <div className="text-2xl font-bold">
          {product.price.amount} {product.price.currency}
        </div>
        {product.price.interval && (
          <div className="text-sm text-(--muted-foreground)">
            {product.price.interval === "month" && (ar ? "شهرياً" : "per month")}
            {product.price.interval === "year" && (ar ? "سنوياً" : "per year")}
            {product.price.interval === "6mo" && (ar ? "كل 6 أشهر" : "per 6 months")}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">
          {ar ? "المزايا:" : "Features:"}
        </div>
        <ul className="space-y-1">
          {(ar ? product.features.ar : product.features.en).map((feature: string, idx: number) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t border-(--border) space-y-2">
        <div className="text-xs text-(--muted-foreground)">
          <div>ID: {product.id}</div>
          <div>Slug: {product.slug}</div>
          <div>{ar ? "المدة:" : "Duration:"} {product.durationDays} {ar ? "يوم" : "days"}</div>
          <div>{ar ? "الخطة:" : "Plan:"} {product.plan}</div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
            {ar ? "تعديل" : "Edit"}
          </Button>
          <Button 
            onClick={handleToggleStatus} 
            disabled={loading}
            variant="secondary" 
            size="sm"
          >
            {product.isActive ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}
          </Button>
          <Button onClick={handleDelete} disabled={loading} variant="ghost" size="sm">
            {ar ? "حذف" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
