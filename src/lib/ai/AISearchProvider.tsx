"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Business } from "@/lib/db/types";
import { FeatureExtractor } from "./ml5Client";
import { SimpleTextFeatures } from "./simpleFeatures";

interface AISearchContextValue {
  isReady: boolean;
  searchSimilar: (query: string, businesses: Business[], locale: "en" | "ar") => Promise<Business[]>;
  findVisuallySimilar: (imageFile: File, businesses: Business[]) => Promise<Business[]>;
  getRecommendations: (business: Business, allBusinesses: Business[], locale: "en" | "ar") => Promise<Business[]>;
}

const AISearchContext = createContext<AISearchContextValue | null>(null);

export function AISearchProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [extractor, setExtractor] = useState<FeatureExtractor | null>(null);
  const [simpleFeatures] = useState(() => new SimpleTextFeatures());

  useEffect(() => {
    let mounted = true;

    async function initializeAI() {
      try {
        // Suppress all console messages during TensorFlow.js initialization
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;
        
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};
        console.info = () => {};
        
        const fe = new FeatureExtractor();
        await fe.initialize();
        
        // Restore console
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
        console.info = originalInfo;
        
        if (mounted) {
          setExtractor(fe);
          setIsReady(true);
        }
      } catch {
        // Silently fallback to simple text features
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeAI();
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const searchSimilar = useCallback(
    async (query: string, businesses: Business[], locale: "en" | "ar"): Promise<Business[]> => {
      if (!query.trim()) return businesses;

      try {
        // Use simple features if ML5 extractor is not available
        const useSimple = !extractor;
        
        if (useSimple) {
          // Use keyword-based relevance scoring for better results
          const businessesWithScore = businesses.map((business) => {
            const textToAnalyze = [
              business.name[locale],
              business.name.en,
              business.name.ar,
              business.description?.[locale] || "",
              business.description?.en || "",
              business.description?.ar || "",
              business.category || "",
              business.city || "",
              ...(business.tags || []),
            ].join(" ");

            // Calculate relevance score based on keyword matching
            const relevanceScore = simpleFeatures.calculateRelevanceScore(query, textToAnalyze);
            
            // Also calculate cosine similarity as secondary score
            const queryFeatures = simpleFeatures.extractFeatures(query);
            const businessFeatures = simpleFeatures.extractFeatures(textToAnalyze);
            const cosineSim = simpleFeatures.cosineSimilarity(queryFeatures, businessFeatures);
            
            // Combined score: 70% relevance + 30% cosine similarity
            const similarity = (relevanceScore * 0.7) + (cosineSim * 0.3);

            return { business, similarity, relevanceScore };
          });

          return businessesWithScore
            .sort((a, b) => b.similarity - a.similarity)
            .map(item => item.business);
        }

        // Use ML5 extractor if available
        const queryFeatures = await extractor!.extractTextFeatures(query);
        
        const businessesWithScore = await Promise.all(
          businesses.map(async (business) => {
            const textToAnalyze = [
              business.name[locale],
              business.description?.[locale] || "",
              business.category || "",
              business.city || "",
              ...(business.tags || []),
            ].join(" ");

            const businessFeatures = await extractor!.extractTextFeatures(textToAnalyze);
            const similarity = extractor!.cosineSimilarity(queryFeatures, businessFeatures);

            return { business, similarity };
          })
        );

        // Sort by similarity and return top results
        return businessesWithScore
          .sort((a, b) => b.similarity - a.similarity)
          .map(item => item.business);
      } catch (error) {
        console.error("AI search error:", error);
        return businesses;
      }
    },
    [extractor, simpleFeatures]
  );

  const findVisuallySimilar = useCallback(
    async (imageFile: File, businesses: Business[]): Promise<Business[]> => {
      // If extractor not available, return businesses with images
      if (!extractor) {
        return businesses.filter(b => b.media?.cover || b.media?.banner || b.media?.logo);
      }

      try {
        // Load the uploaded image
        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const queryFeatures = await extractor.extractImageFeatures(img);
        URL.revokeObjectURL(imageUrl);

        // Compare with businesses that have images
        const businessesWithImages = businesses.filter(b => b.media?.cover || b.media?.banner || b.media?.logo);
        
        const businessesWithScore = await Promise.all(
          businessesWithImages.map(async (business) => {
            const businessImageUrl = business.media?.cover || business.media?.banner || business.media?.logo;
            if (!businessImageUrl) return { business, similarity: 0 };

            const businessImg = new Image();
            businessImg.crossOrigin = "anonymous";
            
            try {
              await new Promise((resolve, reject) => {
                businessImg.onload = resolve;
                businessImg.onerror = reject;
                businessImg.src = businessImageUrl;
              });

              const businessFeatures = await extractor.extractImageFeatures(businessImg);
              const similarity = extractor.cosineSimilarity(queryFeatures, businessFeatures);

              return { business, similarity };
            } catch {
              return { business, similarity: 0 };
            }
          })
        );

        return businessesWithScore
          .filter(item => item.similarity > 0.3) // Threshold
          .sort((a, b) => b.similarity - a.similarity)
          .map(item => item.business);
      } catch (error) {
        console.error("Visual search error:", error);
        return businesses;
      }
    },
    [extractor]
  );

  const getRecommendations = useCallback(
    async (business: Business, allBusinesses: Business[], locale: "en" | "ar"): Promise<Business[]> => {
      // If extractor not available, use simple category matching
      if (!extractor) {
        return allBusinesses
          .filter(b => 
            b.id !== business.id && 
            (b.categoryId === business.categoryId || b.category === business.category)
          )
          .slice(0, 6);
      }

      try {
        const currentText = [
          business.name[locale],
          business.description?.[locale] || "",
          business.category || "",
          ...(business.tags || []),
        ].join(" ");

        const currentFeatures = await extractor.extractTextFeatures(currentText);

        const otherBusinesses = allBusinesses.filter(b => b.id !== business.id);
        
        const businessesWithScore = await Promise.all(
          otherBusinesses.map(async (b) => {
            const text = [
              b.name[locale],
              b.description?.[locale] || "",
              b.category || "",
              ...(b.tags || []),
            ].join(" ");

            const features = await extractor.extractTextFeatures(text);
            const similarity = extractor.cosineSimilarity(currentFeatures, features);

            return { business: b, similarity };
          })
        );

        return businessesWithScore
          .filter(item => item.similarity > 0.5) // Higher threshold for recommendations
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 6) // Top 6 recommendations
          .map(item => item.business);
      } catch (error) {
        console.error("Recommendations error:", error);
        return [];
      }
    },
    [extractor]
  );

  const value: AISearchContextValue = {
    isReady,
    searchSimilar,
    findVisuallySimilar,
    getRecommendations,
  };

  return <AISearchContext.Provider value={value}>{children}</AISearchContext.Provider>;
}

export function useAISearch() {
  const context = useContext(AISearchContext);
  if (!context) {
    throw new Error("useAISearch must be used within AISearchProvider");
  }
  return context;
}
