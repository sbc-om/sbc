/**
 * Smart AI Search Engine
 * Advanced NLP-based search with intent extraction, fuzzy matching,
 * Arabic/English bilingual support, and multi-signal scoring.
 */

import type { Business, Category } from "@/lib/db/types";

/* ─── Types ──────────────────────────────────────────────────── */

export interface SearchIntent {
  /** Raw user query */
  raw: string;
  /** Cleaned/normalized query tokens */
  tokens: string[];
  /** Detected language */
  language: "ar" | "en" | "mixed";
  /** Extracted entities */
  entities: {
    city?: string;
    category?: string;
    tags: string[];
    /** Quality/attribute filters (verified, special, featured, new) */
    attributes: string[];
  };
  /** The core search query after entity extraction */
  coreQuery: string;
  /** User intent type */
  intentType: "find" | "recommend" | "compare" | "info" | "browse";
}

export interface ScoredBusiness {
  business: Business;
  score: number;
  matchReasons: string[];
}

/* ─── Arabic NLP Utilities ───────────────────────────────────── */

/** Common Arabic stop words to skip in scoring */
const AR_STOP_WORDS = new Set([
  "في", "من", "على", "إلى", "عن", "مع", "هل", "ما", "هذا", "هذه",
  "ذلك", "تلك", "التي", "الذي", "كان", "كانت", "هو", "هي", "نحن",
  "أنا", "أنت", "هم", "لا", "لم", "لن", "قد", "إن", "أن", "بعد",
  "قبل", "كل", "بين", "أو", "ثم", "حتى", "إذا", "لكن", "و",
  "بل", "بأن", "عند", "فقط", "أيضا", "جدا", "كثير", "قليل",
  "أبحث", "ابحث", "أريد", "اريد", "أبي", "أبغى", "ابغى", "أبا", "ابا",
  "ابي", "محتاج", "أحتاج", "احتاج", "وين", "فين", "أين",
  "يوجد", "يكون", "نبي", "نبغى", "ابحثلي", "دلني", "دلوني",
  "وش", "شو", "ايش", "إيش", "لو", "سمحت", "ممكن", "يا", "الله",
]);

/** Common English stop words */
const EN_STOP_WORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it",
  "they", "them", "the", "a", "an", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "can", "may", "might", "shall",
  "not", "but", "and", "or", "if", "then", "so", "at", "by", "for",
  "with", "about", "into", "to", "from", "in", "on", "of", "up",
  "out", "no", "nor", "too", "very", "just", "also", "than",
  "find", "looking", "search", "want", "need", "show", "give",
  "where", "what", "which", "who", "how", "please", "help",
  "me", "best", "good", "great", "top", "nearby", "near", "around",
  "recommend", "suggestion", "any", "some", "there",
]);

/** Arabic letter normalization map */
const AR_NORMALIZE_MAP: Record<string, string> = {
  "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
  "ة": "ه",
  "ؤ": "و",
  "ئ": "ي", "ى": "ي",
  "ک": "ك",
  "ی": "ي",
  "ڤ": "ف",
  "گ": "ك",
  "پ": "ب",
  "چ": "ج",
  "ژ": "ز",
};

/** Arabic diacritics regex */
const AR_DIACRITICS = /[\u064B-\u065F\u0670]/g;

/** Remove Arabic definite article "ال" prefix */
function removeAlPrefix(word: string): string {
  if (word.startsWith("ال") && word.length > 3) return word.slice(2);
  if (word.startsWith("وال") && word.length > 4) return word.slice(3);
  if (word.startsWith("بال") && word.length > 4) return word.slice(3);
  if (word.startsWith("كال") && word.length > 4) return word.slice(3);
  if (word.startsWith("لل") && word.length > 3) return word.slice(2);
  return word;
}

/** Normalize Arabic text */
function normalizeArabic(text: string): string {
  let result = text.replace(AR_DIACRITICS, "");
  for (const [from, to] of Object.entries(AR_NORMALIZE_MAP)) {
    result = result.replaceAll(from, to);
  }
  return result;
}

/** Simple Arabic stemmer - removes common prefixes/suffixes */
function stemArabic(word: string): string {
  let s = removeAlPrefix(word);
  // Remove common suffixes
  const suffixes = ["ات", "ين", "ون", "ان", "تين", "ية", "وا", "ها", "هم", "هن", "كم", "نا"];
  for (const suf of suffixes) {
    if (s.endsWith(suf) && s.length - suf.length >= 2) {
      s = s.slice(0, -suf.length);
      break;
    }
  }
  // Remove common prefixes
  const prefixes = ["مت", "مس", "است"];
  for (const pre of prefixes) {
    if (s.startsWith(pre) && s.length - pre.length >= 2) {
      s = s.slice(pre.length);
      break;
    }
  }
  return s;
}

/** Simple English stemmer (Porter-like light stemming) */
function stemEnglish(word: string): string {
  let s = word.toLowerCase();
  if (s.length <= 3) return s;
  // Simple suffix removal
  if (s.endsWith("ies") && s.length > 4) return s.slice(0, -3) + "y";
  if (s.endsWith("ing") && s.length > 5) return s.slice(0, -3);
  if (s.endsWith("tion") && s.length > 5) return s.slice(0, -4);
  if (s.endsWith("ness") && s.length > 5) return s.slice(0, -4);
  if (s.endsWith("ment") && s.length > 5) return s.slice(0, -4);
  if (s.endsWith("able") && s.length > 5) return s.slice(0, -4);
  if (s.endsWith("ful") && s.length > 4) return s.slice(0, -3);
  if (s.endsWith("ous") && s.length > 4) return s.slice(0, -3);
  if (s.endsWith("ive") && s.length > 4) return s.slice(0, -3);
  if (s.endsWith("ed") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("ly") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("er") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("es") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) return s.slice(0, -1);
  return s;
}

/* ─── Synonym / Category Mappings ────────────────────────────── */

/** Bilingual synonym groups for common business-related terms */
const SYNONYM_GROUPS: string[][] = [
  ["restaurant", "restaurants", "مطعم", "مطاعم", "food", "طعام", "أكل", "اكل", "dining"],
  ["cafe", "coffee", "coffeeshop", "قهوة", "كافي", "كافيه", "مقهى", "كوفي"],
  ["hotel", "hotels", "فندق", "فنادق", "accommodation", "إقامة", "اقامه", "نزل"],
  ["shop", "store", "متجر", "محل", "دكان", "shopping", "تسوق"],
  ["market", "supermarket", "سوق", "اسواق", "أسواق", "ماركت", "سوبرماركت", "بقالة"],
  ["gym", "fitness", "نادي", "رياضة", "صالة", "رياضي", "جيم", "لياقة"],
  ["hospital", "clinic", "مستشفى", "عيادة", "صحة", "طبي", "health", "medical", "doctor", "دكتور", "طبيب"],
  ["pharmacy", "صيدلية", "صيدليه", "دواء", "medicine"],
  ["school", "مدرسة", "تعليم", "education", "university", "جامعة", "كلية", "college"],
  ["bank", "بنك", "مصرف", "banking", "مالي", "financial"],
  ["salon", "barber", "صالون", "حلاق", "حلاقة", "beauty", "جمال", "تجميل"],
  ["car", "auto", "سيارة", "سيارات", "automotive", "garage", "كراج", "ورشة"],
  ["travel", "tourism", "سياحة", "سفر", "رحلات", "trip", "tours"],
  ["lawyer", "legal", "محامي", "قانون", "قانوني", "محاماة"],
  ["real estate", "عقارات", "عقار", "property", "بيع", "إيجار"],
  ["construction", "بناء", "مقاولات", "contractor", "مقاول"],
  ["tech", "technology", "تقنية", "تكنولوجيا", "it", "برمجة", "software"],
  ["delivery", "توصيل", "شحن", "shipping", "logistics"],
  ["wedding", "زفاف", "عرس", "حفلات", "events", "فعاليات", "حفلة"],
  ["cleaning", "تنظيف", "نظافة", "laundry", "غسيل", "مغسلة"],
  ["pet", "حيوانات", "بيطري", "veterinary", "vet"],
  ["photography", "تصوير", "مصور", "studio", "ستوديو", "استوديو"],
  ["print", "printing", "طباعة", "مطبعة"],
  ["jewelry", "مجوهرات", "ذهب", "gold", "فضة", "silver"],
  ["perfume", "عطور", "عطر", "fragrance"],
  ["mobile", "phone", "جوال", "هاتف", "موبايل", "اتصالات", "telecom"],
  ["furniture", "أثاث", "اثاث", "مفروشات"],
  ["electronics", "إلكترونيات", "الكترونيات", "كهربائي", "electrical"],
  ["clothing", "clothes", "ملابس", "أزياء", "ازياء", "fashion", "موضة"],
  ["sweets", "حلويات", "حلا", "bakery", "مخبز", "خبز", "cake", "كيك"],
  ["air conditioning", "تكييف", "مكيفات", "ac", "تبريد", "cooling"],
  ["plumber", "plumbing", "سباكة", "سباك"],
  ["electrician", "كهربائي", "كهرباء"],
  ["fast food", "وجبات سريعة", "فاست فود", "برجر", "burger", "pizza", "بيتزا"],
  ["oil", "نفط", "بترول", "petroleum", "gas", "غاز"],
  ["exchange", "صرافة", "صراف", "تحويل", "currency"],
  ["insurance", "تأمين", "تامين"],
];

/** Build a synonym lookup map */
const synonymMap = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const normalized = group.map(w => normalizeArabic(w.toLowerCase()));
  for (const word of normalized) {
    if (!synonymMap.has(word)) synonymMap.set(word, new Set());
    for (const other of normalized) {
      if (other !== word) synonymMap.get(word)!.add(other);
    }
  }
}

/** Get synonyms for a word */
function getSynonyms(word: string): string[] {
  const normalized = normalizeArabic(word.toLowerCase());
  const result: string[] = [];
  // Direct lookup
  const direct = synonymMap.get(normalized);
  if (direct) result.push(...direct);
  // Stem-based lookup
  const stemmed = isArabic(word) ? stemArabic(normalized) : stemEnglish(normalized);
  for (const [key, synonyms] of synonymMap) {
    const keyStemmed = isArabic(key) ? stemArabic(key) : stemEnglish(key);
    if (keyStemmed === stemmed && key !== normalized) {
      result.push(key);
      result.push(...synonyms);
    }
  }
  return [...new Set(result)];
}

/** Common city names (Arabic variants) for entity extraction */
const CITY_NAMES: Record<string, string[]> = {
  "muscat": ["muscat", "مسقط", "مسكت"],
  "salalah": ["salalah", "صلالة", "صلاله"],
  "sohar": ["sohar", "صحار"],
  "nizwa": ["nizwa", "نزوى"],
  "sur": ["sur", "صور"],
  "ibri": ["ibri", "عبري"],
  "barka": ["barka", "بركاء", "بركا"],
  "rustaq": ["rustaq", "الرستاق", "رستاق"],
  "bahla": ["bahla", "بهلا", "بهلاء"],
  "khasab": ["khasab", "خصب"],
  "ibra": ["ibra", "ابرا", "إبراء"],
  "adam": ["adam", "ادم", "أدم"],
  "bidiyah": ["bidiyah", "بديه", "بدية"],
  "seeb": ["seeb", "السيب", "سيب"],
  "bawshar": ["bawshar", "بوشر"],
  "mutrah": ["mutrah", "مطرح"],
  "amerat": ["amerat", "العامرات", "عامرات"],
  "qurum": ["qurum", "القرم", "قرم"],
  "ruwi": ["ruwi", "روي"],
  "dubai": ["dubai", "دبي"],
  "doha": ["doha", "الدوحة", "دوحة"],
  "riyadh": ["riyadh", "الرياض", "رياض"],
  "jeddah": ["jeddah", "جدة", "جده"],
  "manama": ["manama", "المنامة", "منامه"],
  "kuwait": ["kuwait", "الكويت", "كويت"],
};

/** Flatten city names for lookup */
const cityLookup = new Map<string, string>();
for (const [canonical, variants] of Object.entries(CITY_NAMES)) {
  for (const v of variants) {
    cityLookup.set(normalizeArabic(v.toLowerCase()), canonical);
  }
}

/** Attribute keywords */
const ATTRIBUTE_KEYWORDS: Record<string, string[]> = {
  verified: ["verified", "موثق", "موثوق", "معتمد"],
  special: ["special", "مميز", "خاص", "vip"],
  featured: ["featured", "مبرز", "بارز", "مشهور", "popular", "famous"],
  new: ["new", "جديد", "حديث", "latest", "newest"],
  open: ["open", "مفتوح", "24/7"],
};

const attributeLookup = new Map<string, string>();
for (const [attr, keywords] of Object.entries(ATTRIBUTE_KEYWORDS)) {
  for (const k of keywords) {
    attributeLookup.set(normalizeArabic(k.toLowerCase()), attr);
  }
}

/* ─── Intent Classification ──────────────────────────────────── */

const INTENT_PATTERNS: { pattern: RegExp; type: SearchIntent["intentType"] }[] = [
  { pattern: /قارن|مقارنة|compare|versus|vs|الفرق/i, type: "compare" },
  { pattern: /اقترح|نصح|وش تنصح|recommend|suggest|ترشح|رشح/i, type: "recommend" },
  { pattern: /معلومات|تفاصيل|info|details|about|عن\s/i, type: "info" },
  { pattern: /استعرض|تصفح|browse|عرض|كل|all|list/i, type: "browse" },
  // Default is "find"
];

function detectIntentType(text: string): SearchIntent["intentType"] {
  for (const { pattern, type } of INTENT_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return "find";
}

/* ─── Core Functions ─────────────────────────────────────────── */

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function detectLanguage(text: string): "ar" | "en" | "mixed" {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  if (arabicChars > 0 && latinChars > 0) return "mixed";
  if (arabicChars > latinChars) return "ar";
  return "en";
}

/** Tokenize and clean input text */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1)
    .map(t => normalizeArabic(t));
}

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use only two rows for space efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Fuzzy match score: 1.0 = exact, 0.0 = no match */
function fuzzyScore(query: string, target: string): number {
  if (query === target) return 1.0;
  if (target.includes(query)) return 0.9;
  if (query.length <= 2 || target.length <= 2) return 0;

  const distance = levenshtein(query, target);
  const maxLen = Math.max(query.length, target.length);
  const threshold = Math.max(1, Math.floor(maxLen * 0.35));

  if (distance <= threshold) {
    return Math.max(0, 1 - distance / maxLen) * 0.8;
  }
  return 0;
}

/* ─── Intent Extraction ──────────────────────────────────────── */

export function extractIntent(query: string, categories: Category[], locale: "en" | "ar"): SearchIntent {
  const language = detectLanguage(query);
  const tokens = tokenize(query);
  const intentType = detectIntentType(query);

  const entities: SearchIntent["entities"] = {
    tags: [],
    attributes: [],
  };

  const coreTokens: string[] = [];

  // Extract entities from tokens
  for (const token of tokens) {
    // Check if it's a stop word
    const isStop = language === "ar" || language === "mixed"
      ? AR_STOP_WORDS.has(token)
      : EN_STOP_WORDS.has(token);

    // Check for city
    const cityMatch = cityLookup.get(token);
    if (cityMatch && !entities.city) {
      entities.city = cityMatch;
      continue;
    }

    // Check for attribute
    const attrMatch = attributeLookup.get(token);
    if (attrMatch) {
      entities.attributes.push(attrMatch);
      continue;
    }

    // Check for category match
    const categoryMatch = categories.find(c => {
      const nameAr = normalizeArabic(c.name.ar.toLowerCase());
      const nameEn = c.name.en.toLowerCase();
      const slug = c.slug.toLowerCase();
      return (
        token === nameAr ||
        token === nameEn ||
        token === slug ||
        removeAlPrefix(token) === removeAlPrefix(nameAr) ||
        stemArabic(token) === stemArabic(nameAr) ||
        stemEnglish(token) === stemEnglish(nameEn) ||
        fuzzyScore(token, nameAr) > 0.75 ||
        fuzzyScore(token, nameEn) > 0.75
      );
    });

    if (categoryMatch && !entities.category) {
      entities.category = categoryMatch.id;
      continue;
    }

    if (!isStop) {
      coreTokens.push(token);
    }
  }

  return {
    raw: query,
    tokens,
    language,
    entities,
    coreQuery: coreTokens.join(" "),
    intentType,
  };
}

/* ─── Multi-Signal Scoring ───────────────────────────────────── */

interface ScoreWeights {
  nameExact: number;
  nameFuzzy: number;
  nameSynonym: number;
  descriptionMatch: number;
  categoryMatch: number;
  cityMatch: number;
  tagMatch: number;
  attributeBonus: number;
  verifiedBonus: number;
  specialBonus: number;
  featuredBonus: number;
}

const WEIGHTS: ScoreWeights = {
  nameExact: 30,
  nameFuzzy: 15,
  nameSynonym: 12,
  descriptionMatch: 8,
  categoryMatch: 20,
  cityMatch: 15,
  tagMatch: 10,
  attributeBonus: 5,
  verifiedBonus: 2,
  specialBonus: 2,
  featuredBonus: 1,
};

function scoreBusiness(
  business: Business,
  intent: SearchIntent,
  categories: Category[],
  locale: "en" | "ar"
): ScoredBusiness {
  let score = 0;
  const matchReasons: string[] = [];
  const queryTokens = intent.coreQuery ? tokenize(intent.coreQuery) : intent.tokens.filter(t => !AR_STOP_WORDS.has(t) && !EN_STOP_WORDS.has(t));

  if (queryTokens.length === 0 && !intent.entities.city && !intent.entities.category && intent.entities.attributes.length === 0) {
    // No meaningful query - return base score
    return { business, score: business.isVerified ? 1 : 0, matchReasons: [] };
  }

  // ── Name matching ──
  const nameAr = normalizeArabic((business.name.ar || "").toLowerCase());
  const nameEn = (business.name.en || "").toLowerCase();
  const nameTokensAr = tokenize(business.name.ar || "").map(t => removeAlPrefix(t));
  const nameTokensEn = tokenize(business.name.en || "");

  for (const qt of queryTokens) {
    const qtStemAr = stemArabic(qt);
    const qtStemEn = stemEnglish(qt);
    const qtNoAl = removeAlPrefix(qt);

    // Exact name match
    if (nameAr.includes(qt) || nameEn.includes(qt)) {
      score += WEIGHTS.nameExact;
      matchReasons.push(`name:exact:${qt}`);
    }
    // Stem match in name
    else if (
      nameTokensAr.some(nt => stemArabic(nt) === qtStemAr || nt === qtNoAl) ||
      nameTokensEn.some(nt => stemEnglish(nt) === qtStemEn)
    ) {
      score += WEIGHTS.nameFuzzy;
      matchReasons.push(`name:stem:${qt}`);
    }
    // Fuzzy match in name
    else if (
      nameTokensAr.some(nt => fuzzyScore(qtNoAl, removeAlPrefix(nt)) > 0.65) ||
      nameTokensEn.some(nt => fuzzyScore(qt, nt) > 0.65)
    ) {
      score += WEIGHTS.nameFuzzy * 0.7;
      matchReasons.push(`name:fuzzy:${qt}`);
    }
    // Synonym match in name
    else {
      const synonyms = getSynonyms(qt);
      const hasSynonym = synonyms.some(syn => {
        const synNorm = normalizeArabic(syn);
        return nameAr.includes(synNorm) || nameEn.includes(synNorm) ||
          nameTokensAr.some(nt => removeAlPrefix(nt) === removeAlPrefix(synNorm) || stemArabic(nt) === stemArabic(synNorm)) ||
          nameTokensEn.some(nt => stemEnglish(nt) === stemEnglish(synNorm));
      });
      if (hasSynonym) {
        score += WEIGHTS.nameSynonym;
        matchReasons.push(`name:synonym:${qt}`);
      }
    }

    // ── Description matching ──
    const descAr = normalizeArabic((business.description?.ar || "").toLowerCase());
    const descEn = (business.description?.en || "").toLowerCase();
    if (descAr.includes(qt) || descEn.includes(qt)) {
      score += WEIGHTS.descriptionMatch;
      matchReasons.push(`desc:exact:${qt}`);
    } else {
      const descTokensAr = tokenize(business.description?.ar || "").map(t => removeAlPrefix(t));
      const descTokensEn = tokenize(business.description?.en || "");
      if (
        descTokensAr.some(dt => stemArabic(dt) === qtStemAr) ||
        descTokensEn.some(dt => stemEnglish(dt) === qtStemEn)
      ) {
        score += WEIGHTS.descriptionMatch * 0.6;
        matchReasons.push(`desc:stem:${qt}`);
      }
      // Check synonyms in description
      const synonyms = getSynonyms(qt);
      if (synonyms.some(syn => descAr.includes(normalizeArabic(syn)) || descEn.includes(syn.toLowerCase()))) {
        score += WEIGHTS.descriptionMatch * 0.5;
        matchReasons.push(`desc:synonym:${qt}`);
      }
    }

    // ── Tag matching ──
    const tags = (business.tags || []).map(t => normalizeArabic(t.toLowerCase()));
    for (const tag of tags) {
      if (tag.includes(qt) || qt.includes(tag)) {
        score += WEIGHTS.tagMatch;
        matchReasons.push(`tag:exact:${qt}`);
        break;
      }
      if (fuzzyScore(qt, tag) > 0.65 || stemArabic(qt) === stemArabic(tag) || stemEnglish(qt) === stemEnglish(tag)) {
        score += WEIGHTS.tagMatch * 0.7;
        matchReasons.push(`tag:fuzzy:${qt}`);
        break;
      }
      // Synonym match in tags
      const synonyms = getSynonyms(qt);
      if (synonyms.some(syn => tag.includes(normalizeArabic(syn)))) {
        score += WEIGHTS.tagMatch * 0.5;
        matchReasons.push(`tag:synonym:${qt}`);
        break;
      }
    }

    // ── Category text matching ──
    const catText = normalizeArabic((business.category || "").toLowerCase());
    if (catText && (catText.includes(qt) || fuzzyScore(qt, catText) > 0.65)) {
      score += WEIGHTS.categoryMatch * 0.5;
      matchReasons.push(`cat-text:${qt}`);
    }
  }

  // ── Category ID match ──
  if (intent.entities.category) {
    if (business.categoryId === intent.entities.category) {
      score += WEIGHTS.categoryMatch;
      matchReasons.push("category:exact");
    }
  }

  // ── City match ──
  if (intent.entities.city) {
    const businessCity = normalizeArabic((business.city || "").toLowerCase());
    const intentCity = intent.entities.city.toLowerCase();
    const cityVariants = CITY_NAMES[intentCity] || [intentCity];
    if (cityVariants.some(v => businessCity.includes(normalizeArabic(v.toLowerCase())))) {
      score += WEIGHTS.cityMatch;
      matchReasons.push("city:match");
    }
  }

  // ── Attribute bonuses ──
  for (const attr of intent.entities.attributes) {
    switch (attr) {
      case "verified":
        if (business.isVerified) { score += WEIGHTS.attributeBonus; matchReasons.push("attr:verified"); }
        break;
      case "special":
        if (business.isSpecial) { score += WEIGHTS.attributeBonus; matchReasons.push("attr:special"); }
        break;
      case "featured":
        if (business.homepageFeatured || business.homepageTop) { score += WEIGHTS.attributeBonus; matchReasons.push("attr:featured"); }
        break;
    }
  }

  // ── Base quality bonuses ──
  if (business.isVerified) score += WEIGHTS.verifiedBonus;
  if (business.isSpecial) score += WEIGHTS.specialBonus;
  if (business.homepageFeatured || business.homepageTop) score += WEIGHTS.featuredBonus;

  return { business, score, matchReasons };
}

/* ─── Main Search Function ───────────────────────────────────── */

export function smartSearch(
  query: string,
  businesses: Business[],
  categories: Category[],
  locale: "en" | "ar",
  limit: number = 20
): { results: ScoredBusiness[]; intent: SearchIntent } {
  const intent = extractIntent(query, categories, locale);

  // Score all businesses
  const scored = businesses.map(b => scoreBusiness(b, intent, categories, locale));

  // Filter: only include businesses with a score > 0
  const results = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { results, intent };
}

/* ─── Response Generation ────────────────────────────────────── */

export function generateChatResponse(
  query: string,
  results: ScoredBusiness[],
  intent: SearchIntent,
  categories: Category[],
  locale: "en" | "ar",
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): string {
  const isAr = locale === "ar";
  const count = results.length;

  // No results
  if (count === 0) {
    if (isAr) {
      const suggestions: string[] = [];
      if (intent.entities.city) suggestions.push(`في مدينة أخرى`);
      if (intent.coreQuery) suggestions.push(`بكلمات مختلفة`);
      suggestions.push("بتصنيف عام أكثر");
      return `عذراً، لم أجد نتائج لـ "${intent.raw}" 😔\n\nيمكنك تجربة البحث ${suggestions.join(" أو ")}.`;
    }
    const suggestions: string[] = [];
    if (intent.entities.city) suggestions.push("in a different city");
    if (intent.coreQuery) suggestions.push("with different keywords");
    suggestions.push("with a broader category");
    return `Sorry, I couldn't find results for "${intent.raw}" 😔\n\nTry searching ${suggestions.join(" or ")}.`;
  }

  // Build rich response
  const top = results.slice(0, 5);
  const categoryObj = intent.entities.category
    ? categories.find(c => c.id === intent.entities.category)
    : null;

  // Context summary
  let contextParts: string[] = [];
  if (categoryObj) {
    contextParts.push(isAr ? `في تصنيف "${categoryObj.name[locale]}"` : `in "${categoryObj.name[locale]}" category`);
  }
  if (intent.entities.city) {
    const cityDisplay = Object.entries(CITY_NAMES).find(([k]) => k === intent.entities.city)?.[1]?.[isAr ? 1 : 0] || intent.entities.city;
    contextParts.push(isAr ? `في ${cityDisplay}` : `in ${cityDisplay}`);
  }
  const contextStr = contextParts.length > 0
    ? (isAr ? ` ${contextParts.join(" و")}` : ` ${contextParts.join(" and ")}`)
    : "";

  let response = "";

  if (isAr) {
    // Arabic response
    if (count === 1) {
      const b = top[0].business;
      const reasons = describeMatch(top[0], locale);
      response = `✅ وجدت نتيجة واحدة${contextStr}:\n\n`;
      response += `🏢 **${b.name.ar}**`;
      if (b.city) response += ` — ${b.city}`;
      response += "\n";
      if (b.description?.ar) response += `${b.description.ar.slice(0, 150)}${b.description.ar.length > 150 ? '...' : ''}\n`;
      if (b.isVerified) response += "✓ موثق ";
      if (b.isSpecial) response += "⭐ مميز ";
      if (reasons) response += `\n💡 ${reasons}`;
    } else {
      response = `🔍 وجدت **${count}** نشاط تجاري${contextStr}.\n\n`;

      if (intent.intentType === "recommend") {
        response = `💡 أنصحك بهذه الأنشطة التجارية${contextStr}:\n\n`;
      }

      response += `**أفضل النتائج:**\n`;
      for (let i = 0; i < top.length; i++) {
        const b = top[i].business;
        const badges: string[] = [];
        if (b.isVerified) badges.push("✓");
        if (b.isSpecial) badges.push("⭐");
        const badgeStr = badges.length > 0 ? ` ${badges.join(" ")}` : "";

        response += `${i + 1}. **${b.name.ar}**${badgeStr}`;
        if (b.city) response += ` — ${b.city}`;
        response += "\n";
        if (b.description?.ar) {
          response += `   ${b.description.ar.slice(0, 100)}${b.description.ar.length > 100 ? '...' : ''}\n`;
        }
      }

      if (count > 5) {
        response += `\n📋 و ${count - 5} نتيجة أخرى في القائمة أدناه.`;
      }

      // Add helpful tips based on intent
      if (!intent.entities.city && count > 3) {
        response += "\n\n💬 يمكنك تحديد المدينة لتضييق النتائج.";
      }
    }
  } else {
    // English response
    if (count === 1) {
      const b = top[0].business;
      const reasons = describeMatch(top[0], locale);
      response = `✅ Found 1 result${contextStr}:\n\n`;
      response += `🏢 **${b.name.en}**`;
      if (b.city) response += ` — ${b.city}`;
      response += "\n";
      if (b.description?.en) response += `${b.description.en.slice(0, 150)}${b.description.en.length > 150 ? '...' : ''}\n`;
      if (b.isVerified) response += "✓ Verified ";
      if (b.isSpecial) response += "⭐ Special ";
      if (reasons) response += `\n💡 ${reasons}`;
    } else {
      response = `🔍 Found **${count}** businesses${contextStr}.\n\n`;

      if (intent.intentType === "recommend") {
        response = `💡 Here are my recommendations${contextStr}:\n\n`;
      }

      response += `**Top results:**\n`;
      for (let i = 0; i < top.length; i++) {
        const b = top[i].business;
        const badges: string[] = [];
        if (b.isVerified) badges.push("✓");
        if (b.isSpecial) badges.push("⭐");
        const badgeStr = badges.length > 0 ? ` ${badges.join(" ")}` : "";

        response += `${i + 1}. **${b.name.en}**${badgeStr}`;
        if (b.city) response += ` — ${b.city}`;
        response += "\n";
        if (b.description?.en) {
          response += `   ${b.description.en.slice(0, 100)}${b.description.en.length > 100 ? '...' : ''}\n`;
        }
      }

      if (count > 5) {
        response += `\n📋 Plus ${count - 5} more results in the list below.`;
      }

      if (!intent.entities.city && count > 3) {
        response += "\n\n💬 You can specify a city to narrow down results.";
      }
    }
  }

  return response;
}

/** Describe why a business matched */
function describeMatch(scored: ScoredBusiness, locale: "en" | "ar"): string {
  const reasons = scored.matchReasons;
  if (reasons.length === 0) return "";

  const isAr = locale === "ar";
  const parts: string[] = [];

  if (reasons.some(r => r.startsWith("name:exact"))) {
    parts.push(isAr ? "تطابق مباشر في الاسم" : "Direct name match");
  } else if (reasons.some(r => r.startsWith("name:synonym"))) {
    parts.push(isAr ? "مرتبط بالبحث" : "Related to your search");
  }
  if (reasons.includes("category:exact")) {
    parts.push(isAr ? "نفس التصنيف" : "Same category");
  }
  if (reasons.includes("city:match")) {
    parts.push(isAr ? "في المدينة المطلوبة" : "In the requested city");
  }

  return parts.join(isAr ? "، " : ", ");
}
