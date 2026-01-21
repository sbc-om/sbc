"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch, FiUpload, FiX, FiFilter, FiZap } from "react-icons/fi";

import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { Business, Category } from "@/lib/db/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { useAISearch } from "@/lib/ai/AISearchProvider";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(b: Business, locale: Locale) {
  return normalize(
    [
      b.name[locale],
      b.name.en,
      b.name.ar,
      b.description?.[locale],
      b.description?.en,
      b.description?.ar,
      b.slug,
      b.city,
      b.category,
      b.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function BusinessesExplorer({
  locale,
  dict,
  businesses,
  categories,
  detailsBasePath = "/businesses",
}: {
  locale: Locale;
  dict: Dictionary;
  businesses: Business[];
  categories: Category[];
  /** Route prefix for business details links. Example: "/businesses" or "/explorer" */
  detailsBasePath?: string;
}) {
  const [activeTab, setActiveTab] = useState<"advanced" | "ai" | "deep">("advanced");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [aiResults, setAiResults] = useState<Business[] | null>(null);
  
  // AI Search
  const { isReady, searchSimilar, findVisuallySimilar } = useAISearch();
  const [aiQuery, setAiQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Deep Search (Chat)
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleAITextSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const results = await searchSimilar(aiQuery, businesses, locale);
      setAiResults(results);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImage(file);
    setIsAiSearching(true);
    try {
      const results = await findVisuallySimilar(file, businesses);
      setAiResults(results);
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearAISearch = () => {
    setAiQuery("");
    setUploadedImage(null);
    setAiResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeepSearch = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);
    
    try {
      // Search businesses
      const results = await searchSimilar(userMessage, businesses, locale);
      setAiResults(results);
      
      // Generate response
      const response = locale === "ar"
        ? `یافتم ${results.length} نشاط تجاری مرتبط با "‎${userMessage}‎". ${results.length > 0 ? 'بهترین نتیجه: ' + results[0].name[locale] : ''}`
        : `Found ${results.length} businesses related to "${userMessage}". ${results.length > 0 ? 'Top result: ' + results[0].name[locale] : ''}`;
      
      // Simulate typing effect
      await new Promise(resolve => setTimeout(resolve, 500));
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      const errorMsg = locale === "ar" ? "خطا در جستجو" : "Search error";
      setChatMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filtered = useMemo(() => {
    // If AI results are active, use them instead
    const sourceBusinesses = aiResults || businesses;

    const tokens = normalize(q)
      .split(" ")
      .filter(Boolean);

    const tagTokens = normalize(tags)
      .split(/[ ,]+/)
      .filter(Boolean);

    const cityToken = normalize(city);

    return sourceBusinesses.filter((b) => {
      if (categoryId && b.categoryId !== categoryId) return false;
      if (cityToken && normalize(b.city ?? "").includes(cityToken) === false) return false;

      if (tagTokens.length) {
        const t = (b.tags ?? []).map((x) => normalize(x));
        for (const need of tagTokens) {
          if (!t.some((x) => x.includes(need))) return false;
        }
      }

      if (tokens.length) {
        const h = haystack(b, locale);
        for (const t of tokens) {
          if (!h.includes(t)) return false;
        }
      }

      return true;
    });
  }, [businesses, aiResults, q, city, tags, categoryId, locale]);

  return (
    <div>
      {/* Search Tabs */}
      <div className="sbc-card rounded-2xl overflow-hidden">
        {/* Tab Headers - Shadcn Style */}
        <div className="inline-flex h-14 items-center justify-start rounded-t-2xl bg-(--muted) p-1 text-muted-foreground w-full">
          <button
            type="button"
            onClick={() => {
              setActiveTab("advanced");
              clearAISearch();
            }}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
              activeTab === "advanced"
                ? "bg-(--surface) text-(--foreground) shadow-sm border border-(--surface-border)"
                : "text-(--muted-foreground) hover:text-(--foreground)"
            }`}
          >
            <FiFilter className="h-4 w-4" />
            {locale === "ar" ? "جستجوی پیشرفته" : "Advanced"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
              activeTab === "ai"
                ? "bg-(--surface) text-(--foreground) shadow-sm border border-(--surface-border)"
                : "text-(--muted-foreground) hover:text-(--foreground)"
            }`}
          >
            <FiZap className="h-4 w-4" />
            {locale === "ar" ? "جستجو با AI" : "AI Search"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deep")}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
              activeTab === "deep"
                ? "bg-(--surface) text-(--foreground) shadow-sm border border-(--surface-border)"
                : "text-(--muted-foreground) hover:text-(--foreground)"
            }`}
          >
            <FiSearch className="h-4 w-4" />
            {locale === "ar" ? "گفتگو" : "Deep"}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === "advanced" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.home.searchPlaceholder}
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={locale === "ar" ? "المدينة" : "City"}
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={locale === "ar" ? "وسوم (مثال: مطعم, قهوة)" : "Tags (e.g. cafe, food)"}
          />
          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            placeholder={locale === "ar" ? "كل التصنيفات" : "All categories"}
            searchPlaceholder={locale === "ar" ? "ابحث عن تصنيف..." : "Search categories..."}
            locale={locale}
          />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <div className="text-(--muted-foreground)">
                  {locale === "ar" ? `النتائج: ${filtered.length}` : `Results: ${filtered.length}`}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    setCity("");
                    setTags("");
                    setCategoryId("");
                    setAiResults(null);
                  }}
                >
                  {locale === "ar" ? "مسح" : "Clear"}
                </Button>
              </div>
            </>
          ) : activeTab === "ai" ? (
            // AI Search Tab
            <>
              <div className="space-y-5">
                {/* Text Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {locale === "ar" ? "جستجوی هوشمند متنی" : "Smart Text Search"}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !isAiSearching) {
                          e.preventDefault();
                          handleAITextSearch();
                        }
                      }}
                      placeholder={locale === "ar" ? "جستجوی معنایی..." : "Semantic search..."}
                      disabled={isAiSearching}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAITextSearch();
                      }}
                      disabled={!aiQuery.trim() || isAiSearching}
                    >
                      <FiSearch className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Image Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {locale === "ar" ? "جستجوی تصویری" : "Visual Search"}
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                    disabled={isAiSearching}
                  />
                  
                  {uploadedImage ? (
                    // Preview
                    <div className="space-y-3">
                      <div 
                        onClick={() => !isAiSearching && fileInputRef.current?.click()}
                        className="group relative cursor-pointer"
                      >
                        <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-(--surface-border) bg-(--chip-bg) transition hover:border-accent hover:bg-(--surface) p-2">
                          <div className="relative h-full w-auto">
                            <Image
                              src={URL.createObjectURL(uploadedImage)}
                              alt="Preview"
                              width={400}
                              height={96}
                              className="h-full w-auto object-contain rounded-lg"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setUploadedImage(null);
                            setAiResults(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-10"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-(--muted-foreground) text-center">
                        {uploadedImage.name}
                      </p>
                    </div>
                  ) : (
                    // Upload Zone
                    <div 
                      onClick={() => !isAiSearching && fileInputRef.current?.click()}
                      className="group relative cursor-pointer block"
                    >
                      <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-(--surface-border) bg-(--chip-bg) transition hover:border-accent hover:bg-(--surface)">
                        <div className="text-center">
                          <FiUpload className="mx-auto h-8 w-8 text-(--muted-foreground)" />
                          <p className="mt-2 text-xs text-(--muted-foreground)">
                            {locale === "ar" ? "کلیک کنید برای انتخاب تصویر" : "Click to select image"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Status */}
                {!isReady && (
                  <div className="text-xs text-(--muted-foreground) bg-(--muted) px-3 py-2 rounded-lg">
                    {locale === "ar"
                      ? "⚡ در حال بارگذاری مدل هوش مصنوعی..."
                      : "⚡ Loading AI model..."}
                  </div>
                )}

                {isAiSearching && (
                  <div className="text-xs text-(--muted-foreground) bg-(--muted) px-3 py-2 rounded-lg animate-pulse">
                    {locale === "ar" ? "🔍 در حال تحلیل..." : "🔍 Analyzing..."}
                  </div>
                )}

                {/* Results Counter */}
                <div className="flex items-center justify-between gap-3 text-sm pt-2 border-t border-(--surface-border)">
                  <div className="text-(--muted-foreground)">
                    {aiResults
                      ? locale === "ar"
                        ? `✨ نتایج هوش مصنوعی: ${filtered.length}`
                        : `✨ AI Results: ${filtered.length}`
                      : locale === "ar"
                        ? `النتائج: ${filtered.length}`
                        : `Results: ${filtered.length}`}
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={(e) => {
                      e.preventDefault();
                      clearAISearch();
                    }}
                  >
                    {locale === "ar" ? "پاک کردن" : "Clear"}
                  </Button>
                </div>
              </div>
            </>
          ) : activeTab === "deep" ? (
            // Deep Search (Chat)
            <>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 rounded-xl border border-(--surface-border) bg-(--background) p-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-(--muted-foreground) text-sm">
                      {locale === "ar" 
                        ? "💬 سوال خود را بپرسید و من بهترین نشاط‌ها را پیدا می‌کنم"
                        : "💬 Ask me anything and I'll find the best businesses for you"}
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                            msg.role === "user"
                              ? "bg-(--accent) text-(--accent-foreground)"
                              : "bg-(--muted) text-(--foreground)"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-(--muted) text-(--foreground) rounded-xl px-4 py-2.5 text-sm">
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce" style={{animationDelay: "0ms"}}>•</span>
                          <span className="animate-bounce" style={{animationDelay: "150ms"}}>•</span>
                          <span className="animate-bounce" style={{animationDelay: "300ms"}}>•</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isTyping) {
                        e.preventDefault();
                        handleDeepSearch();
                      }
                    }}
                    placeholder={locale === "ar" ? "سوال خود را بپرسید..." : "Ask your question..."}
                    disabled={isTyping}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeepSearch();
                    }}
                    disabled={!chatInput.trim() || isTyping}
                  >
                    <FiSearch className="h-4 w-4" />
                  </Button>
                </div>

                {/* Results Counter */}
                {aiResults && (
                  <div className="flex items-center justify-between gap-3 text-sm pt-2 border-t border-(--surface-border)">
                    <div className="text-(--muted-foreground)">
                      {locale === "ar"
                        ? `🔍 یافت شد: ${aiResults.length} نشاط`
                        : `🔍 Found: ${aiResults.length} businesses`}
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setChatMessages([]);
                        setAiResults(null);
                      }}
                    >
                      {locale === "ar" ? "پاک کردن" : "Clear"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => {
          const name = locale === "ar" ? b.name.ar : b.name.en;
          const description = b.description ? (locale === "ar" ? b.description.ar : b.description.en) : "";
          const img = b.media?.cover || b.media?.banner || b.media?.logo;

          const href = b.username 
            ? `/@${b.username}` 
            : `/${locale}${detailsBasePath}/${b.slug}`;
          
          return (
            <Link
              key={b.id}
              href={href}
              className="group sbc-card sbc-card--interactive overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-square w-full bg-linear-to-br from-accent/10 via-accent-2/10 to-transparent">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={name} className="h-full w-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="truncate text-base font-semibold text-white drop-shadow">
                      {name}
                    </div>
                    {b.isVerified ? (
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-blue-200"
                        aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                        title={locale === "ar" ? "نشاط موثق" : "Verified business"}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                  {b.isSpecial ? (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
                      </svg>
                      {locale === "ar" ? "مميز" : "Special"}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-5">
                {description ? (
                  <p className="line-clamp-2 text-sm text-(--muted-foreground)">
                    {description}
                  </p>
                ) : (
                  <p className="text-sm text-(--muted-foreground)">
                    {locale === "ar" ? "لا يوجد وصف" : "No description"}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted-foreground)">
                  <span className="font-mono">/{b.slug}</span>
                  {b.city ? <span className="sbc-chip rounded-full px-2 py-0.5">{b.city}</span> : null}
                  {b.tags?.slice(0, 5).map((t) => (
                    <span key={t} className="sbc-chip rounded-full px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center text-(--muted-foreground)">
          {dict.businesses.empty}
        </div>
      ) : null}
    </div>
  );
}
