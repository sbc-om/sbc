"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function NewProductForm({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    program: "directory" as "directory" | "loyalty" | "marketing",
    plan: "",
    durationDays: 30,
    name: { en: "", ar: "" },
    description: { en: "", ar: "" },
    price: { amount: 0, currency: "OMR" as "OMR" | "USD", interval: undefined as "month" | "year" | "6mo" | undefined },
    badges: [] as string[],
    features: { en: [""], ar: [""] },
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }
      
      router.push(`/${locale}/admin/products`);
      router.refresh();
    } catch (err) {
      alert(ar ? `فشل الإنشاء: ${err}` : `Creation failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = (lang: "en" | "ar") => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [lang]: [...formData.features[lang], ""],
      },
    });
  };

  const removeFeature = (lang: "en" | "ar", idx: number) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [lang]: formData.features[lang].filter((_, i) => i !== idx),
      },
    });
  };

  const updateFeature = (lang: "en" | "ar", idx: number, value: string) => {
    const newFeatures = [...formData.features[lang]];
    newFeatures[idx] = value;
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [lang]: newFeatures,
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ar ? "إضافة منتج جديد" : "Add New Product"}
        </h1>
        <Link
          href={`/${locale}/admin/products`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "إلغاء" : "Cancel"}
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="sbc-card p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "معلومات أساسية" : "Basic Information"}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "Slug (معرف URL)" : "Slug (URL identifier)"}
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                placeholder="directory-membership-yearly"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "البرنامج" : "Program"}
              </label>
              <select
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value as any })}
                className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-2"
                required
              >
                <option value="directory">{ar ? "دليل الأعمال" : "Business Directory"}</option>
                <option value="loyalty">{ar ? "نظام الولاء" : "Loyalty System"}</option>
                <option value="marketing">{ar ? "منصة التسويق" : "Marketing Platform"}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "الخطة" : "Plan"}
              </label>
              <Input
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                placeholder="monthly, yearly, etc."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "المدة (بالأيام)" : "Duration (days)"}
              </label>
              <Input
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Names */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "الأسماء" : "Names"}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "الاسم (English)" : "Name (English)"}
            </label>
            <Input
              value={formData.name.en}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "الاسم (العربية)" : "Name (Arabic)"}
            </label>
            <Input
              value={formData.name.ar}
              onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
              required
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "الأوصاف" : "Descriptions"}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "الوصف (English)" : "Description (English)"}
            </label>
            <Textarea
              value={formData.description.en}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar ? "الوصف (العربية)" : "Description (Arabic)"}
            </label>
            <Textarea
              value={formData.description.ar}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ar: e.target.value } })}
              rows={3}
              required
            />
          </div>
        </div>

        {/* Price */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "السعر" : "Price"}</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "المبلغ" : "Amount"}
              </label>
              <Input
                type="number"
                value={formData.price.amount}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price, amount: Number(e.target.value) } })}
                min="0"
                step="0.001"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "العملة" : "Currency"}
              </label>
              <select
                value={formData.price.currency}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price, currency: e.target.value as any } })}
                className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-2"
              >
                <option value="OMR">OMR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "الفترة" : "Interval"}
              </label>
              <select
                value={formData.price.interval || ""}
                onChange={(e) => setFormData({ ...formData, price: { ...formData.price, interval: e.target.value as any || undefined } })}
                className="w-full rounded-xl border border-(--border) bg-(--background) px-4 py-2"
              >
                <option value="">{ar ? "لا يوجد" : "None"}</option>
                <option value="month">{ar ? "شهري" : "Monthly"}</option>
                <option value="6mo">{ar ? "نصف سنوي" : "6 Months"}</option>
                <option value="year">{ar ? "سنوي" : "Yearly"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Features EN */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "المزايا (English)" : "Features (English)"}</h3>
          {formData.features.en.map((feature, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => updateFeature("en", idx, e.target.value)}
                placeholder="Feature description"
              />
              <Button
                type="button"
                onClick={() => removeFeature("en", idx)}
                variant="ghost"
                size="sm"
              >
                {ar ? "حذف" : "Remove"}
              </Button>
            </div>
          ))}
          <Button type="button" onClick={() => addFeature("en")} variant="secondary" size="sm">
            {ar ? "إضافة ميزة" : "Add Feature"}
          </Button>
        </div>

        {/* Features AR */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{ar ? "المزايا (العربية)" : "Features (Arabic)"}</h3>
          {formData.features.ar.map((feature, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => updateFeature("ar", idx, e.target.value)}
                placeholder="وصف الميزة"
              />
              <Button
                type="button"
                onClick={() => removeFeature("ar", idx)}
                variant="ghost"
                size="sm"
              >
                {ar ? "حذف" : "Remove"}
              </Button>
            </div>
          ))}
          <Button type="button" onClick={() => addFeature("ar")} variant="secondary" size="sm">
            {ar ? "إضافة ميزة" : "Add Feature"}
          </Button>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Link
            href={`/${locale}/admin/products`}
            className={buttonVariants({ variant: "ghost" })}
          >
            {ar ? "إلغاء" : "Cancel"}
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (ar ? "جاري الإنشاء..." : "Creating...") : (ar ? "إنشاء المنتج" : "Create Product")}
          </Button>
        </div>
      </form>
    </div>
  );
}
