/**
 * ML5 Client-side AI utilities
 * Browser-only - uses ml5.js and TensorFlow.js
 */

let ml5Instance: any = null;

export async function loadML5() {
  if (typeof window === "undefined") {
    throw new Error("ml5 can only be used in the browser");
  }

  if (ml5Instance) return ml5Instance;

  try {
    // Configure TensorFlow.js to disable WebGPU and use WebGL backend
    // @ts-ignore - TensorFlow.js global flags
    if (typeof window !== 'undefined' && !window.tf) {
      const tf = await import('@tensorflow/tfjs');
      // Set flags to disable WebGPU
      tf.env().set('WEBGPU_ENABLED', false);
      tf.env().set('WEBGL_VERSION', 2);
      // Expose tf globally for ml5
      // @ts-ignore
      window.tf = tf;
    }
    
    // Suppress ml5.js console messages
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalError = console.error;
    
    // Temporarily disable console
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.error = () => {};
    
    // Dynamic import for client-side only
    const module = await import("ml5");
    ml5Instance = module.default || module;
    
    // Restore console
    console.log = originalLog;
    console.warn = originalWarn;
    console.info = originalInfo;
    console.error = originalError;
    
    return ml5Instance;
  } catch (error) {
    // Silent fallback
    return null;
  }
}

/**
 * Feature Extractor for semantic similarity
 */
export class FeatureExtractor {
  private extractor: any = null;
  private ml5: any = null;

  async initialize() {
    try {
      this.ml5 = await loadML5();
      
      // Try to use imageClassifier if available
      if (this.ml5 && typeof this.ml5.imageClassifier === 'function') {
        // Suppress TensorFlow.js errors during initialization
        const originalError = console.error;
        const originalWarn = console.warn;
        console.error = () => {};
        console.warn = () => {};
        
        try {
          this.extractor = await this.ml5.imageClassifier("MobileNet");
        } catch (e) {
          // Silent fallback to text-only
        }
        
        console.error = originalError;
        console.warn = originalWarn;
      }
    } catch (error) {
      // Silently fallback to text-only features
    }
    return this;
  }

  async extractTextFeatures(text: string): Promise<number[]> {
    // Simple text embedding using character frequencies
    // For production, use a proper embedding model
    const features = new Array(128).fill(0);
    const normalized = text.toLowerCase();
    
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i) % 128;
      features[code] += 1;
    }
    
    // Normalize
    const sum = features.reduce((a, b) => a + b, 0);
    return features.map(f => sum > 0 ? f / sum : 0);
  }

  async extractImageFeatures(imageElement: HTMLImageElement): Promise<number[]> {
    if (!this.extractor) await this.initialize();
    
    // If extractor is not available, return a simple hash-based feature vector
    if (!this.extractor) {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, 224, 224);
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const features = new Array(128).fill(0);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const idx = Math.floor((i / 4) % 128);
          features[idx] += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        }
        const sum = features.reduce((a, b) => a + b, 0);
        return features.map(f => sum > 0 ? f / sum : 0);
      }
      return new Array(128).fill(0);
    }
    
    try {
      // For ml5 imageClassifier, we just use the model's internal features
      const results = await this.extractor.classify(imageElement);
      // Convert classification results to a feature vector
      const features = new Array(128).fill(0);
      results.forEach((r: any, i: number) => {
        if (i < 10) features[i * 12] = r.confidence;
      });
      return features;
    } catch (error) {
      console.error("Image feature extraction error:", error);
      return new Array(128).fill(0);
    }
  }

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

/**
 * Image Classifier for business category detection
 */
export class ImageClassifier {
  private classifier: any = null;
  private ml5: any = null;

  async initialize() {
    this.ml5 = await loadML5();
    this.classifier = await this.ml5.imageClassifier("MobileNet");
    return this;
  }

  async classifyImage(imageElement: HTMLImageElement): Promise<Array<{ label: string; confidence: number }>> {
    if (!this.classifier) await this.initialize();
    const results = await this.classifier.classify(imageElement);
    return results;
  }
}

/**
 * Sentiment Analysis for comments/reviews
 */
export class SentimentAnalyzer {
  private model: any = null;
  private ml5: any = null;

  async initialize() {
    this.ml5 = await loadML5();
    this.model = await this.ml5.sentiment("movieReviews");
    return this;
  }

  async analyzeSentiment(text: string): Promise<{ score: number; label: "positive" | "negative" | "neutral" }> {
    if (!this.model) await this.initialize();
    const prediction = await this.model.predict(text);
    
    let label: "positive" | "negative" | "neutral";
    if (prediction > 0.6) label = "positive";
    else if (prediction < 0.4) label = "negative";
    else label = "neutral";
    
    return { score: prediction, label };
  }
}
