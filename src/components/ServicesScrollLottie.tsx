"use client";

import Lottie from "lottie-react";

import servicesAnimationData from "../../public/animation/services.json";

export function ServicesScrollLottie({ className }: { className?: string }) {
  return (
    <div className={"mx-auto w-full " + (className ?? "")} aria-label="Services animation">
      <Lottie
        animationData={servicesAnimationData}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}