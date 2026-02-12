"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { StoreProduct } from "@/lib/store/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

export function EditProductForm({ product, locale }: { product: StoreProduct; locale: Locale }) {
  const router = useRouter();
  const { toast } = useToast();
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    slug: product.slug,
    program: product.program,
    plan: product.plan,
    durationDays: product.durationDays,
    nameEn: product.name.en,
    nameAr: product.name.ar,
    descriptionEn: product.description.en,
    descriptionAr: product.description.ar,
    priceAmount: product.price.amount,
    priceCurrency: product.price.currency,
    priceInterval: product.price.interval || "",
    featuresEn: product.features.en.join("\n"),
    featuresAr: product.features.ar.join("\n"),
    badges: product.badges?.join(", ") || "",
    active: product.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        slug: formData.slug,
        program: formData.program,
        plan: formData.plan,
        durationDays: formData.durationDays,
        name: {
          en: formData.nameEn,
          ar: formData.nameAr,
        },
        description: {
          en: formData.descriptionEn,
          ar: formData.descriptionAr,
        },
        price: {
          amount: formData.priceAmount,
          currency: formData.priceCurrency,
          interval: formData.priceInterval || undefined,
        },
        features: {
          en: formData.featuresEn.split("\n").filter(Boolean),
          ar: formData.featuresAr.split("\n").filter(Boolean),
        },
        badges: formData.badges ? formData.badges.split(",").map((b: string) => b.trim()).filter(Boolean) : [],
        isActive: formData.active,
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update product");
      }

      router.push(`/${locale}/admin/products`);
      router.refresh();
    } catch (error: any) {
      toast({ message: ar ? `خطا: ${error.message}` : `Error: ${error.message}`, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "اسلاگ (Slug)" : "Slug"}
          </label>
          <Input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="directory-membership-yearly"
            required
          />
          <p className="mt-1 text-xs text-(--muted-foreground)">
            {ar ? "فقط حروف انگلیسی کوچک، اعداد و خط تیره" : "Only lowercase letters, numbers, and hyphens"}
          </p>
        </div>

        {/* Program */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "برنامه" : "Program"}
          </label>
          <select
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg bg-(--background) border-(--border)"
            required
          >
            <option value="directory">{ar ? "دليل الأعمال" : "Business Directory"}</option>
            <option value="loyalty">{ar ? "نظام الولاء" : "Loyalty System"}</option>
            <option value="marketing">{ar ? "منصة التسويق" : "Marketing Platform"}</option>
          </select>
        </div>

        {/* Plan */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "خطة" : "Plan"}
          </label>
          <Input
            type="text"
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            placeholder="monthly"
            required
          />
        </div>

        {/* Duration Days */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "المدة (أيام)" : "Duration (days)"}
          </label>
          <Input
            type="number"
            value={formData.durationDays}
            onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
            min="1"
            required
          />
        </div>
      </div>

      {/* Name */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الاسم (إنجليزي)" : "Name (English)"}
          </label>
          <Input
            type="text"
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            placeholder="Business Directory - Membership"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الاسم (عربي)" : "Name (Arabic)"}
          </label>
          <Input
            type="text"
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            placeholder="دليل الأعمال - عضوية"
            required
            dir="rtl"
          />
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الوصف (إنجليزي)" : "Description (English)"}
          </label>
          <Textarea
            value={formData.descriptionEn}
            onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
            placeholder="Annual membership in the business directory."
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الوصف (عربي)" : "Description (Arabic)"}
          </label>
          <Textarea
            value={formData.descriptionAr}
            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
            placeholder="عضوية سنوية في دليل الأعمال."
            rows={3}
            required
            dir="rtl"
          />
        </div>
      </div>

      {/* Price */}
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "السعر" : "Price Amount"}
          </label>
          <Input
            type="number"
            value={formData.priceAmount}
            onChange={(e) => setFormData({ ...formData, priceAmount: parseFloat(e.target.value) })}
            min="0"
            step="0.001"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "العملة" : "Currency"}
          </label>
          <select
            value={formData.priceCurrency}
            onChange={(e) => setFormData({ ...formData, priceCurrency: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg bg-(--background) border-(--border)"
          >
            <option value="OMR">OMR</option>

          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الفترة" : "Interval"}
          </label>
          <select
            value={formData.priceInterval}
            onChange={(e) => setFormData({ ...formData, priceInterval: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg bg-(--background) border-(--border)"
          >
            <option value="">{ar ? "مرة واحدة" : "One-time"}</option>
            <option value="month">{ar ? "شهري" : "Monthly"}</option>
            <option value="6mo">{ar ? "6 أشهر" : "6 Months"}</option>
            <option value="year">{ar ? "سنوي" : "Yearly"}</option>
          </select>
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "المزايا (إنجليزي)" : "Features (English)"}
          </label>
          <Textarea
            value={formData.featuresEn}
            onChange={(e) => setFormData({ ...formData, featuresEn: e.target.value })}
            placeholder="One feature per line&#10;Directory membership&#10;Standard listing visibility"
            rows={5}
            required
          />
          <p className="mt-1 text-xs text-(--muted-foreground)">
            {ar ? "ميزة واحدة في كل سطر" : "One feature per line"}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "المزايا (عربي)" : "Features (Arabic)"}
          </label>
          <Textarea
            value={formData.featuresAr}
            onChange={(e) => setFormData({ ...formData, featuresAr: e.target.value })}
            placeholder="ميزة واحدة في كل سطر&#10;عضوية في الدليل&#10;ظهور قياسي للإدراج"
            rows={5}
            required
            dir="rtl"
          />
          <p className="mt-1 text-xs text-(--muted-foreground)" dir="rtl">
            {ar ? "ميزة واحدة في كل سطر" : "One feature per line"}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {ar ? "الشارات (اختياري)" : "Badges (Optional)"}
        </label>
        <Input
          type="text"
          value={formData.badges}
          onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
          placeholder="Best, Save, Popular"
        />
        <p className="mt-1 text-xs text-(--muted-foreground)">
          {ar ? "افصل بفاصلة" : "Comma separated"}
        </p>
      </div>

      {/* Active */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="active" className="text-sm font-medium">
          {ar ? "نشط" : "Active"}
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} variant="primary">
          {loading ? (ar ? "جاري التحديث..." : "Updating...") : (ar ? "تحديث المحصول" : "Update Product")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${locale}/admin/products`)}
        >
          {ar ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}
