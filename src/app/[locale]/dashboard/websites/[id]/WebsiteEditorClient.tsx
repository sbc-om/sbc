"use client";

import { useState, useCallback } from "react";
import {
  HiOutlinePlusCircle,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiChevronUp,
  HiChevronDown,
  HiOutlineHome,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";
import type { WebsitePage, WebsiteBlock, WebsitePackage } from "@/lib/db/types";
import { WEBSITE_PACKAGE_LIMITS } from "@/lib/db/types";
import { PageBlockEditor } from "./PageBlockEditor";

interface Props {
  locale: Locale;
  websiteId: string;
  initialPages: WebsitePage[];
  websitePackage: WebsitePackage;
}

export function WebsiteEditorClient({
  locale,
  websiteId,
  initialPages,
  websitePackage,
}: Props) {
  const ar = locale === "ar";
  const limits = WEBSITE_PACKAGE_LIMITS[websitePackage];
  const [pages, setPages] = useState<WebsitePage[]>(initialPages);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialPages.find((p) => p.isHomepage)?.id ?? initialPages[0]?.id ?? null
  );
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null;
  const canAddMore = limits.maxPages === -1 || pages.length < limits.maxPages;

  const slugify = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  const handleAddPage = async () => {
    if (!newPageTitle.trim()) return;
    const slug = newPageSlug.trim() || slugify(newPageTitle);

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/websites/${websiteId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: { en: newPageTitle, ar: newPageTitle },
          isHomepage: false,
          blocks: [],
          sortOrder: pages.length,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Error");
        return;
      }
      setPages((prev) => [...prev, data.page]);
      setSelectedPageId(data.page.id);
      setIsAddingPage(false);
      setNewPageTitle("");
      setNewPageSlug("");
    } catch {
      setError(ar ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    if (page.isHomepage) {
      setError(ar ? "لا يمكن حذف الصفحة الرئيسية" : "Cannot delete homepage");
      return;
    }
    if (!confirm(ar ? "هل أنت متأكد من حذف هذه الصفحة?" : "Delete this page?")) return;

    try {
      await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
        method: "DELETE",
      });
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      if (selectedPageId === pageId) {
        setSelectedPageId(pages.find((p) => p.id !== pageId)?.id ?? null);
      }
    } catch {
      setError(ar ? "خطأ في الحذف" : "Delete error");
    }
  };

  const handleSaveBlocks = useCallback(
    async (pageId: string, blocks: WebsiteBlock[]) => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        });
        const data = await res.json();
        if (data.ok) {
          setPages((prev) =>
            prev.map((p) => (p.id === pageId ? { ...p, blocks } : p))
          );
        }
      } catch {}
    },
    [websiteId]
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar: Pages list */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sbc-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {ar ? "الصفحات" : "Pages"}{" "}
              <span className="text-(--muted-foreground) font-normal">
                ({pages.length}{limits.maxPages > 0 ? `/${limits.maxPages}` : ""})
              </span>
            </h2>
          </div>

          <ul className="space-y-1">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-start transition ${
                    selectedPageId === page.id
                      ? "bg-accent/10 text-accent font-semibold"
                      : "hover:bg-(--surface) text-foreground"
                  }`}
                >
                  {page.isHomepage ? (
                    <HiOutlineHome className="h-4 w-4 shrink-0" />
                  ) : (
                    <HiOutlineDocumentText className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate flex-1">
                    {page.title[locale] || page.title.en}
                  </span>
                  {!page.isPublished && (
                    <HiOutlineEyeSlash className="h-3.5 w-3.5 text-(--muted-foreground)" />
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Add page */}
          {canAddMore && (
            <div className="mt-3">
              {isAddingPage ? (
                <div className="space-y-2 rounded-xl bg-(--surface) p-3">
                  <Input
                    placeholder={ar ? "عنوان الصفحة" : "Page title"}
                    value={newPageTitle}
                    onChange={(e) => {
                      setNewPageTitle(e.target.value);
                      if (!newPageSlug || newPageSlug === slugify(newPageTitle)) {
                        setNewPageSlug(slugify(e.target.value));
                      }
                    }}
                    className="text-sm"
                  />
                  <Input
                    placeholder="slug"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleAddPage} disabled={isSaving}>
                      {ar ? "إضافة" : "Add"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingPage(false)}
                    >
                      {ar ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingPage(true)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-(--muted-foreground) hover:text-foreground hover:bg-(--surface) transition"
                >
                  <HiOutlinePlusCircle className="h-4 w-4" />
                  {ar ? "صفحة جديدة" : "Add Page"}
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          )}
        </div>
      </aside>

      {/* Main: Block editor */}
      <div className="flex-1 min-w-0">
        {selectedPage ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {selectedPage.title[locale] || selectedPage.title.en}
                </h2>
                {selectedPage.isHomepage && (
                  <span className="sbc-chip rounded-full px-2 py-0.5 text-xs">
                    {ar ? "الرئيسية" : "Homepage"}
                  </span>
                )}
              </div>
              {!selectedPage.isHomepage && (
                <button
                  type="button"
                  onClick={() => handleDeletePage(selectedPage.id)}
                  className="text-sm text-red-500 hover:text-red-600 transition flex items-center gap-1"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                  {ar ? "حذف" : "Delete"}
                </button>
              )}
            </div>

            <PageBlockEditor
              locale={locale}
              pageId={selectedPage.id}
              blocks={selectedPage.blocks}
              onSave={(blocks: WebsiteBlock[]) => handleSaveBlocks(selectedPage.id, blocks)}
            />
          </div>
        ) : (
          <div className="sbc-card rounded-2xl p-12 text-center text-(--muted-foreground)">
            <HiOutlineDocumentText className="mx-auto h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">
              {ar ? "اختر صفحة لتعديلها" : "Select a page to edit"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
