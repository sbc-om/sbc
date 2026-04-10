"use client";

import dynamic from "next/dynamic";

const ScrollLottie = dynamic(
  () => import("@/components/ScrollLottie").then((mod) => mod.ScrollLottie),
  {
    ssr: false,
    loading: () => (
      <div className="relative mx-auto w-full max-w-md py-8" aria-hidden="true">
        <div className="aspect-square w-full rounded-full bg-white/4" />
      </div>
    ),
  },
);

type LazyScrollLottieProps = {
  scrollFactor?: number;
};

export function LazyScrollLottie({ scrollFactor = 1.2 }: LazyScrollLottieProps) {
  return <ScrollLottie scrollFactor={scrollFactor} />;
}
