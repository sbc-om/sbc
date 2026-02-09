/**
 * Simple AI features without ML5 dependency
 * Enhanced fallback implementation with fuzzy matching, Arabic support, and relevance scoring
 */

/** Arabic diacritics regex */
const AR_DIACRITICS = /[\u064B-\u065F\u0670]/g;

/** Arabic letter normalization */
const AR_NORMALIZE: Record<string, string> = {
  "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
  "ة": "ه", "ؤ": "و", "ئ": "ي", "ى": "ي",
  "ک": "ك", "ی": "ي", "ڤ": "ف", "گ": "ك",
};

function normalizeArabicText(text: string): string {
  let r = text.replace(AR_DIACRITICS, "");
  for (const [from, to] of Object.entries(AR_NORMALIZE)) {
    r = r.replaceAll(from, to);
  }
  // Remove "ال" prefix for matching
  return r;
}

export class SimpleTextFeatures {
  /**
   * Extract keywords from text with Arabic normalization
   */
  private extractKeywords(text: string): string[] {
    const normalized = normalizeArabicText(text.toLowerCase().trim());
    return normalized
      .split(/[\s,،.؟?!:;]+/)
      .filter(word => word.length > 1)
      .map(word => word.replace(/[^\w\u0600-\u06FF]/g, ''));
  }

  /**
   * Calculate keyword match score with exact, partial, fuzzy, and Arabic-aware matching
   */
  calculateRelevanceScore(query: string, businessText: string): number {
    const queryKeywords = this.extractKeywords(query);
    const businessKeywords = this.extractKeywords(businessText);
    const businessLower = normalizeArabicText(businessText.toLowerCase());
    
    if (queryKeywords.length === 0) return 0;
    
    let score = 0;
    const maxScore = queryKeywords.length * 10;
    
    for (const queryWord of queryKeywords) {
      // Skip very short words and common stop words
      if (queryWord.length <= 1) continue;
      
      const queryNoAl = queryWord.startsWith("ال") && queryWord.length > 3 
        ? queryWord.slice(2) : queryWord;

      // Exact match in business keywords (highest score)
      if (businessKeywords.some(bw => bw === queryWord || bw === queryNoAl)) {
        score += 10;
      }
      // Exact match without "ال" prefix
      else if (businessKeywords.some(bw => {
        const bwNoAl = bw.startsWith("ال") && bw.length > 3 ? bw.slice(2) : bw;
        return bwNoAl === queryNoAl;
      })) {
        score += 9;
      }
      // Partial match (business keyword contains query word or vice versa)
      else if (businessKeywords.some(bw => bw.includes(queryNoAl) || queryNoAl.includes(bw))) {
        score += 6;
      }
      // Substring match in full text
      else if (businessLower.includes(queryWord) || businessLower.includes(queryNoAl)) {
        score += 4;
      }
      // Fuzzy match (Levenshtein distance <= 2)
      else if (businessKeywords.some(bw => this.levenshtein(queryNoAl, bw) <= Math.max(1, Math.floor(queryNoAl.length * 0.3)))) {
        score += 3;
      }
    }
    
    // Normalize score to [0, 1]
    return Math.min(score / maxScore, 1);
  }

  /**
   * Levenshtein distance for fuzzy matching
   */
  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      [prev, curr] = [curr, prev];
    }
    return prev[n];
  }

  /**
   * Extract simple features from text using character frequencies and word presence
   */
  extractFeatures(text: string): number[] {
    const features = new Array(128).fill(0);
    const normalized = text.toLowerCase();
    
    // Character frequency features (first 64 dimensions)
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i) % 64;
      features[code] += 1;
    }
    
    // Word presence features (next 64 dimensions)
    const words = normalized.split(/\s+/);
    const uniqueWords = new Set(words);
    uniqueWords.forEach((word) => {
      const hash = this.simpleHash(word) % 64;
      features[64 + hash] += 1;
    });
    
    // Normalize to [0, 1]
    const sum = features.reduce((a, b) => a + b, 0);
    return features.map(f => sum > 0 ? f / sum : 0);
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Cosine similarity between two feature vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
