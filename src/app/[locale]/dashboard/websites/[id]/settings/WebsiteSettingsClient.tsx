"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineGlobeAlt,
  HiOutlinePaintBrush,
  HiOutlineMegaphone,
  HiOutlineLink,
  HiOutlineTrash,
} from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";
import type { Website } from "@/lib/db/types";
import { WEBSITE_PACKAGE_LIMITS } from "@/lib/db/types";

interface Props {
  locale: Locale;
  website: Website;
}

export function WebsiteSettingsClient({ locale, website }: Props) {
  const router = useRouter();
  const ar = locale === "ar";
  const limits = WEBSITE_PACKAGE_LIMITS[website.package];

  const [tab, setTab] = useState<"general" | "branding" | "domain" | "social" | "seo" | "danger">("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // General
  const [titleEn, setTitleEn] = useState(website.title.en);
  const [titleAr, setTitleAr] = useState(website.title.ar);
  const [taglineEn, setTaglineEn] = useState(website.tagline?.en ?? "");
  const [taglineAr, setTaglineAr] = useState(website.tagline?.ar ?? "");
  const [slug, setSlug] = useState(website.slug);

  // Branding
  const [primaryColor, setPrimaryColor] = useState(website.branding?.primaryColor ?? "#2563eb");
  const [secondaryColor, setSecondaryColor] = useState(website.branding?.secondaryColor ?? "#7c3aed");
  const [logoUrl, setLogoUrl] = useState(website.branding?.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(website.branding?.faviconUrl ?? "");

  // Domain
  const [customDomain, setCustomDomain] = useState(website.customDomain ?? "");

  // Social
  const [instagram, setInstagram] = useState(website.socials?.instagram ?? "");
  const [facebook, setFacebook] = useState(website.socials?.facebook ?? "");
  const [x, setX] = useState(website.socials?.x ?? "");
  const [whatsapp, setWhatsapp] = useState(website.socials?.whatsapp ?? "");

  // SEO
  const [metaDescEn, setMetaDescEn] = useState(website.metaDescription?.en ?? "");
  const [metaDescAr, setMetaDescAr] = useState(website.metaDescription?.ar ?? "");

  // Contact
  const [contactEmail, setContactEmail] = useState(website.contact?.email ?? "");
  const [contactPhone, setContactPhone] = useState(website.contact?.phone ?? "");

  // Footer
  const [footerEn, setFooterEn] = useState(website.footerText?.en ?? "");
  const [footerAr, setFooterAr] = useState(website.footerText?.ar ?? "");

  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/websites/${website.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Error");
      } else {
        setSuccess(ar ? "تم الحفظ بنجاح" : "Saved successfully");
        router.refresh();
      }
    } catch {
      setError(ar ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = () => {
    save({ action: website.isPublished ? "unpublish" : "publish" });
  };

  const handleDelete = async () => {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا الموقع نهائيًا؟" : "Permanently delete this website?")) return;
    try {
      await fetch(`/api/websites/${website.id}`, { method: "DELETE" });
      router.push(`/${locale}/dashboard/websites`);
    } catch {
      setError(ar ? "خطأ في الحذف" : "Delete error");
    }
  };

  const tabs = [
    { key: "general" as const, label: ar ? "عام" : "General", Icon: HiOutlineGlobeAlt },
    { key: "branding" as const, label: ar ? "الهوية" : "Branding", Icon: HiOutlinePaintBrush },
    { key: "domain" as const, label: ar ? "النطاق" : "Domain", Icon: HiOutlineLink },
    { key: "social" as const, label: ar ? "التواصل" : "Social", Icon: HiOutlineMegaphone },
    { key: "seo" as const, label: "SEO", Icon: HiOutlineGlobeAlt },
    { key: "danger" as const, label: ar ? "خطر" : "Danger", Icon: HiOutlineTrash },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Tabs */}
      <aside className="w-full lg:w-56 shrink-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                tab === t.key
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-(--surface) text-(--muted-foreground)"
              }`}
            >
              <t.Icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 sbc-card rounded-2xl p-6">
        {(error || success) && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300"
            }`}
          >
            {error || success}
          </div>
        )}

        {/* General Tab */}
        {tab === "general" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{ar ? "الإعدادات العامة" : "General Settings"}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{ar ? "اسم الموقع (EN)" : "Title (EN)"}</label>
                <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{ar ? "اسم الموقع (AR)" : "Title (AR)"}</label>
                <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" className="mt-1" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{ar ? "الشعار (EN)" : "Tagline (EN)"}</label>
                <Input value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{ar ? "الشعار (AR)" : "Tagline (AR)"}</label>
                <Input value={taglineAr} onChange={(e) => setTaglineAr(e.target.value)} dir="rtl" className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-(--muted-foreground)">sbc.om/site/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{ar ? "البريد الإلكتروني" : "Contact Email"}</label>
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{ar ? "الهاتف" : "Contact Phone"}</label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{ar ? "نص التذييل (EN)" : "Footer (EN)"}</label>
                <Input value={footerEn} onChange={(e) => setFooterEn(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{ar ? "نص التذييل (AR)" : "Footer (AR)"}</label>
                <Input value={footerAr} onChange={(e) => setFooterAr(e.target.value)} dir="rtl" className="mt-1" />
              </div>
            </div>

            {/* Publish */}
            <div className="flex items-center gap-4 pt-4 border-t border-(--surface-border)">
              <Button onClick={handlePublishToggle} variant={website.isPublished ? "secondary" : "primary"}>
                {website.isPublished
                  ? ar ? "إلغاء النشر" : "Unpublish"
                  : ar ? "نشر الموقع" : "Publish Website"}
              </Button>
              <span className="text-sm text-(--muted-foreground)">
                {website.isPublished
                  ? ar ? "الموقع متاح للجمهور" : "Website is live"
                  : ar ? "الموقع في وضع المسودة" : "Website is in draft mode"}
              </span>
            </div>

            <Button
              onClick={() =>
                save({
                  title: { en: titleEn, ar: titleAr },
                  tagline: { en: taglineEn, ar: taglineAr },
                  slug,
                  contact: { email: contactEmail, phone: contactPhone },
                  footerText: { en: footerEn, ar: footerAr },
                })
              }
              disabled={saving}
            >
              {saving ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
            </Button>
          </div>
        )}

        {/* Branding Tab */}
        {tab === "branding" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{ar ? "الهوية البصرية" : "Branding"}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{ar ? "اللون الأساسي" : "Primary Color"}</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-(--surface-border)"
                  />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{ar ? "اللون الثانوي" : "Secondary Color"}</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-(--surface-border)"
                  />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-32" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{ar ? "رابط الشعار" : "Logo URL"}</label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium">{ar ? "رابط الأيقونة" : "Favicon URL"}</label>
              <Input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>

            <Button
              onClick={() =>
                save({
                  branding: {
                    primaryColor,
                    secondaryColor,
                    logoUrl: logoUrl || undefined,
                    faviconUrl: faviconUrl || undefined,
                  },
                })
              }
              disabled={saving}
            >
              {saving ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
            </Button>
          </div>
        )}

        {/* Domain Tab */}
        {tab === "domain" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{ar ? "النطاق المخصص" : "Custom Domain"}</h2>

            {!limits.customDomain ? (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-sm text-yellow-700 dark:text-yellow-300">
                {ar
                  ? "النطاق المخصص متاح فقط في الباقة الاحترافية أو المتقدمة. قم بترقية الباقة للاستفادة."
                  : "Custom domains are available on Professional and Enterprise plans. Upgrade to use this feature."}
              </div>
            ) : (
              <>
                <p className="text-sm text-(--muted-foreground)">
                  {ar
                    ? "أضف نطاقك المخصص. قم بتوجيه CNAME إلى sites.sbc.om"
                    : "Add your custom domain. Point a CNAME record to sites.sbc.om"}
                </p>
                <div>
                  <label className="text-sm font-medium">{ar ? "النطاق" : "Domain"}</label>
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="www.example.com"
                    className="mt-1"
                  />
                </div>

                <div className="rounded-xl bg-(--chip-bg) p-4 text-sm">
                  <p className="font-medium mb-2">DNS Configuration:</p>
                  <code className="block text-xs bg-(--surface) p-2 rounded-lg">
                    CNAME {customDomain || "your-domain.com"} → sites.sbc.om
                  </code>
                </div>

                <Button
                  onClick={() => save({ customDomain: customDomain || null })}
                  disabled={saving}
                >
                  {saving ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Social Tab */}
        {tab === "social" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{ar ? "شبكات التواصل" : "Social Media"}</h2>
            {[
              { label: "Instagram", value: instagram, set: setInstagram, placeholder: "https://instagram.com/..." },
              { label: "Facebook", value: facebook, set: setFacebook, placeholder: "https://facebook.com/..." },
              { label: "X (Twitter)", value: x, set: setX, placeholder: "https://x.com/..." },
              { label: "WhatsApp", value: whatsapp, set: setWhatsapp, placeholder: "+968..." },
            ].map((s) => (
              <div key={s.label}>
                <label className="text-sm font-medium">{s.label}</label>
                <Input value={s.value} onChange={(e) => s.set(e.target.value)} placeholder={s.placeholder} className="mt-1" />
              </div>
            ))}

            <Button
              onClick={() => save({ socials: { instagram, facebook, x, whatsapp } })}
              disabled={saving}
            >
              {saving ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
            </Button>
          </div>
        )}

        {/* SEO Tab */}
        {tab === "seo" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">{ar ? "تحسين محركات البحث" : "SEO"}</h2>

            <div>
              <label className="text-sm font-medium">Meta Description (EN)</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-xl p-3 text-sm text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50"
                style={{ border: "2px solid var(--surface-border)", backgroundColor: "var(--background)" }}
                value={metaDescEn}
                onChange={(e) => setMetaDescEn(e.target.value)}
                maxLength={160}
              />
              <p className="text-xs text-(--muted-foreground) mt-1">{metaDescEn.length}/160</p>
            </div>

            <div>
              <label className="text-sm font-medium">Meta Description (AR)</label>
              <textarea
                dir="rtl"
                rows={3}
                className="mt-1 w-full rounded-xl p-3 text-sm text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50"
                style={{ border: "2px solid var(--surface-border)", backgroundColor: "var(--background)" }}
                value={metaDescAr}
                onChange={(e) => setMetaDescAr(e.target.value)}
                maxLength={160}
              />
              <p className="text-xs text-(--muted-foreground) mt-1">{metaDescAr.length}/160</p>
            </div>

            <Button
              onClick={() => save({ metaDescription: { en: metaDescEn, ar: metaDescAr } })}
              disabled={saving}
            >
              {saving ? (ar ? "جاري الحفظ…" : "Saving…") : (ar ? "حفظ" : "Save")}
            </Button>
          </div>
        )}

        {/* Danger Tab */}
        {tab === "danger" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-red-600">{ar ? "منطقة الخطر" : "Danger Zone"}</h2>
            <p className="text-sm text-(--muted-foreground)">
              {ar
                ? "حذف الموقع سيؤدي إلى إزالة جميع الصفحات والمحتوى نهائيًا. هذا الإجراء لا يمكن التراجع عنه."
                : "Deleting this website will permanently remove all pages and content. This action cannot be undone."}
            </p>
            <Button variant="secondary" onClick={handleDelete} className="text-red-600">
              <HiOutlineTrash className="h-4 w-4" />
              {ar ? "حذف الموقع نهائيًا" : "Delete Website Permanently"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
