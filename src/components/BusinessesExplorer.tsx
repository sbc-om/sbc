"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch, FiUpload, FiX, FiFilter, FiZap, FiMessageCircle } from "react-icons/fi";

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
  // Unified search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [city, setCity] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [aiResults, setAiResults] = useState<Business[] | null>(null);
  
  // AI Search
  const { isReady, searchSimilar, findVisuallySimilar } = useAISearch();
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat interface
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const results = await searchSimilar(searchQuery, businesses, locale);
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

  const clearSearch = () => {
    setSearchQuery("");
    setUploadedImage(null);
    setAiResults(null);
    setCity("");
    setTags("");
    setCategoryId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChatSearch = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const results = await searchSimilar(userMessage, businesses, locale);
      setAiResults(results);
      
      let response = "";
      if (results.length === 0) {
        response = locale === "ar"
          ? `عذراً، لم أجد أي نشاط تجاري لـ "${userMessage}". يرجى تجربة بحث آخر.`
          : `Sorry, I couldn't find any businesses for "${userMessage}". Please try a different search.`;
      } else if (results.length === 1) {
        const business = results[0];
        response = locale === "ar"
          ? `وجدته! ${business.name[locale]} في ${business.city || 'منطقتك'}. ${business.description?.[locale] || ''}`
          : `Found it! ${business.name[locale]} in ${business.city || 'your area'}. ${business.description?.[locale] || ''}`;
      } else {
        const top3 = results.slice(0, 3).map(b => b.name[locale]).join(locale === "ar" ? '، ' : ', ');
        response = locale === "ar"
          ? `وجدت ${results.length} نشاط تجاري. الأفضل: ${top3}. انظر القائمة الكاملة أدناه.`
          : `Found ${results.length} businesses. Top picks: ${top3}. See full list below.`;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error('Chat search error:', error);
      const errorMsg = locale === "ar" 
        ? "خطأ في البحث. يرجى المحاولة مرة أخرى."
        : "Search error. Please try again.";
      setChatMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filtered = useMemo(() => {
    const sourceBusinesses = aiResults || businesses;

    const tokens = normalize(searchQuery)
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
  }, [businesses, aiResults, searchQuery, city, tags, categoryId, locale]);

  return (
    <div>
      {/* Unified Search Interface */}
      <div className="sbc-card rounded-2xl overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Main Search Bar with AI */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isAiSearching) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={locale === "ar" ? "ابحث عن نشاط تجاري... (بحث ذكي)" : "Search businesses... (Smart search)"}
                disabled={isAiSearching}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                disabled={!searchQuery.trim() || isAiSearching}
              >
                {isAiSearching ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSearch className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <FiFilter className="h-3.5 w-3.5" />
                {locale === "ar" ? "فلاتر متقدمة" : "Advanced Filters"}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAiSearching}
              >
                <FiUpload className="h-3.5 w-3.5" />
                {locale === "ar" ? "بحث بالصورة" : "Search by Image"}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                disabled={isAiSearching}
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowChat(!showChat)}
              >
                <FiMessageCircle className="h-3.5 w-3.5" />
                {locale === "ar" ? "محادثة ذكية" : "AI Chat"}
              </Button>

              {(searchQuery || uploadedImage || aiResults || city || tags || categoryId) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                >
                  <FiX className="h-3.5 w-3.5" />
                  {locale === "ar" ? "مسح الكل" : "Clear All"}
                </Button>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {uploadedImage && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-(--surface-border) bg-(--muted)">
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={URL.createObjectURL(uploadedImage)}
                  alt="Preview"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedImage.name}</p>
                <p className="text-xs text-(--muted-foreground)">
                  {locale === "ar" ? "بحث بصري نشط" : "Visual search active"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedImage(null);
                  setAiResults(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-3 p-4 rounded-xl border border-(--surface-border) bg-(--background) animate-in slide-in-from-top duration-200">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FiFilter className="h-4 w-4" />
                {locale === "ar" ? "الفلاتر المتقدمة" : "Advanced Filters"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={locale === "ar" ? "المدينة" : "City"}
                />
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={locale === "ar" ? "الوسوم (مثال: مطعم، قهوة)" : "Tags (e.g. cafe, food)"}
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
            </div>
          )}

          {/* AI Chat Interface */}
          {showChat && (
            <div className="space-y-3 p-4 rounded-xl border border-(--surface-border) bg-(--background) animate-in slide-in-from-top duration-200">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FiMessageCircle className="h-4 w-4" />
                {locale === "ar" ? "المحادثة الذكية" : "AI Chat Assistant"}
              </h3>
              
              <div className="h-[300px] overflow-y-auto rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <FiMessageCircle className="h-12 w-12 text-(--muted-foreground) opacity-20 mb-3" />
                      <p className="text-(--muted-foreground) text-sm max-w-md">
                        {locale === "ar" 
                          ? "اسأل سؤالك وسأجد لك أفضل الأنشطة التجارية 💬"
                          : "Ask me anything and I'll find the best businesses for you 💬"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom duration-300`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              msg.role === "user"
                                ? "bg-(--accent) text-(--accent-foreground)"
                                : "bg-(--muted) text-(--foreground) border border-(--surface-border)"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start animate-in fade-in duration-200">
                          <div className="bg-(--muted) text-(--foreground) rounded-2xl px-4 py-3 border border-(--surface-border) shadow-sm">
                            <div className="flex gap-1.5">
                              <span className="w-2 h-2 bg-(--foreground) rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                              <span className="w-2 h-2 bg-(--foreground) rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                              <span className="w-2 h-2 bg-(--foreground) rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isTyping && chatInput.trim()) {
                      e.preventDefault();
                      handleChatSearch();
                    }
                  }}
                  placeholder={locale === "ar" ? "اسأل سؤالك..." : "Ask your question..."}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleChatSearch();
                  }}
                  disabled={!chatInput.trim() || isTyping}
                >
                  {isTyping ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSearch className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-(--surface-border) text-sm">
            <div className="flex items-center gap-2">
              {aiResults && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  <FiZap className="h-3 w-3" />
                  {locale === "ar" ? "بحث ذكي" : "AI Search"}
                </span>
              )}
              <span className="text-(--muted-foreground)">
                {locale === "ar" 
                  ? `${filtered.length} نتيجة`
                  : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            
            {!isReady && (
              <div className="text-xs text-(--muted-foreground) flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                {locale === "ar" ? "جاري تحميل AI..." : "Loading AI..."}
              </div>
            )}
          </div>
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
