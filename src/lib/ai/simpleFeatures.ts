/**
 * Simple AI features without ML5 dependency
 * Fallback implementation for when ML5 is not available
 */

export class SimpleTextFeatures {
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
