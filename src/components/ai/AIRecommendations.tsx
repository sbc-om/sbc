"use client";

import { useState, useEffect } from "react";
import { useAISearch } from "@/lib/ai/AISearchProvider";
import { AIBusinessCard } from "./AIBusinessCard";
import type { Business } from "@/lib/db/types";

interface AIRecommendationsProps {
  currentBusiness: Business;
  allBusinesses: Business[];
  locale: "en" | "ar";
}

export function AIRecommendations({ currentBusiness, allBusinesses, locale }: AIRecommendationsProps) {
  const { isReady, getRecommendations } = useAISearch();
  const [recommendations, setRecommendations] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Respect business owner's choice to hide similar recommendations
  const showSimilar = currentBusiness.showSimilarBusinesses !== false;

  useEffect(() => {
    let mounted = true;

    async function loadRecommendations() {
      if (!isReady || !showSimilar) return;

      setIsLoading(true);
      try {
        const results = await getRecommendations(currentBusiness, allBusinesses, locale);
        if (mounted) {
          setRecommendations(results);
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      mounted = false;
    };
  }, [isReady, showSimilar, currentBusiness, allBusinesses, locale, getRecommendations]);

  // If business owner disabled similar recommendations, don't render anything
  if (!showSimilar) {
    return null;
  }

  if (!isReady || isLoading) {
    return (
      <div className="sbc-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="h-5 w-5 animate-pulse text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-semibold">
            {locale === "ar" ? "پیشنهادات هوشمند" : "Smart Recommendations"}
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="sbc-card rounded-2xl h-64 animate-pulse bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="sbc-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/15 to-blue-500/15 px-3 py-1.5">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {locale === "ar" ? "پیشنهادات مشابه با AI" : "Similar by AI"}
          </span>
        </div>
        <h3 className="text-lg font-semibold flex-1">
          {locale === "ar" ? "ممکن است دوست داشته باشید" : "You might also like"}
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((business) => (
          <AIBusinessCard key={business.id} business={business} locale={locale} />
        ))}
      </div>
    </div>
  );
}
