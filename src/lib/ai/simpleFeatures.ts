/**
 * Simple AI features without ML5 dependency
 * Fallback implementation with keyword matching and relevance scoring
 */

export class SimpleTextFeatures {
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const normalized = text.toLowerCase().trim();
    // Split by spaces and filter out short words
    return normalized
      .split(/[\s,،.]+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^\w\u0600-\u06FF]/g, ''));
  }

  /**
   * Calculate keyword match score with exact and partial matching
   */
  calculateRelevanceScore(query: string, businessText: string): number {
    const queryKeywords = this.extractKeywords(query);
    const businessKeywords = this.extractKeywords(businessText);
    const businessLower = businessText.toLowerCase();
    
    if (queryKeywords.length === 0) return 0;
    
    let score = 0;
    const maxScore = queryKeywords.length * 10;
    
    for (const queryWord of queryKeywords) {
      // Exact match in business keywords (highest score)
      if (businessKeywords.some(bw => bw === queryWord)) {
        score += 10;
      }
      // Partial match (business keyword contains query word)
      else if (businessKeywords.some(bw => bw.includes(queryWord) || queryWord.includes(bw))) {
        score += 5;
      }
      // Substring match in full text
      else if (businessLower.includes(queryWord)) {
        score += 2;
      }
    }
    
    // Normalize score to [0, 1]
    return Math.min(score / maxScore, 1);
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
