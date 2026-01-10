"use client";

import Lottie from "lottie-react";
import animationData from "../../public/animation/logo.json";

export function AboutLogoLottie({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={className} aria-label="SBC logo animation">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
