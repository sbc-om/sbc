"use client";

import React from "react";

import loyaltyAnimationData from "../../public/animation/loyalty.json";
import { ScrollLottie } from "@/components/ScrollLottie";

export function LoyaltyScrollLottie({ className }: { className?: string }) {
  return (
    <ScrollLottie
      animationData={loyaltyAnimationData}
      className={className}
      // Loyalty animation feels nicer when it progresses a bit slower.
      scrollFactor={0.65}
    />
  );
}
