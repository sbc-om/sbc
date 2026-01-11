"use client";

import React from "react";

import logoAnimationData from "../../public/animation/logo.json";
import { ScrollLottie } from "@/components/ScrollLottie";

export function LogoScrollLottie({ className }: { className?: string }) {
  return (
    <ScrollLottie
      animationData={logoAnimationData}
      className={className}
      // Logo animation is shorter; make it progress a bit slower for a smoother feel.
      scrollFactor={0.9}
      glow={true}
    />
  );
}
