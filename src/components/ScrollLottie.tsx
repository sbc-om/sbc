"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import defaultAnimationData from "../../public/animation/walk.json";

type ScrollLottieProps = {
  /** Lottie JSON object. Defaults to the homepage walk animation. */
  animationData?: unknown;
  /** Tailwind classes for the outer wrapper. */
  className?: string;
  /** When true, renders the ambient glow behind the animation. Default: true. */
  glow?: boolean;
  /** How quickly the animation reaches the end. Lower = faster. Default: 0.5 */
  scrollFactor?: number;
};

export function ScrollLottie({
  animationData = defaultAnimationData,
  className,
  glow = true,
  scrollFactor = 0.5,
}: ScrollLottieProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for animation to be loaded
    const timer = setTimeout(() => {
      setIsReady(true);
      if (lottieRef.current) {
        lottieRef.current.pause();
        lottieRef.current.goToAndStop(0, true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let ticking = false;
    let lastScrollY = window.scrollY;
    let currentFrame = 0;

    // Easing function for smooth transitions
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        if (lottieRef.current) {
          const animation = lottieRef.current;
          const totalFrames = animation.getDuration(true) ?? 0;
          if (totalFrames <= 0) {
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }
          
          // Calculate scroll progress (0 to 1) with smooth easing
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const factor = Math.min(Math.max(scrollFactor, 0.05), 5);
          const rawProgress = Math.min(Math.max(currentScrollY / (maxScroll * factor), 0), 1);
          const scrollProgress = easeOutCubic(rawProgress);
          
          // Map scroll progress to animation frame with interpolation
          const targetFrame = scrollProgress * totalFrames;
          
          // Smooth interpolation to target frame (reduces jitter)
          const lerpFactor = 0.15; // Lower = smoother but slightly delayed
          currentFrame = currentFrame + (targetFrame - currentFrame) * lerpFactor;
          
          // Update animation
          animation.goToAndStop(Math.round(currentFrame), true);
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    // Initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isReady, scrollFactor]);

  return (
    <div className={"w-full max-w-md mx-auto py-8 relative " + (className ?? "")}>
      <div
        className="relative z-10"
        style={{
          filter: "drop-shadow(0 15px 40px rgba(79, 70, 229, 0.25))",
        }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          style={{
            width: "100%",
            height: "auto",
          }}
        />
      </div>
      
      {/* Ambient glow effect */}
      {glow ? (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-2/20 rounded-full blur-3xl animate-pulse delay-300" />
        </div>
      ) : null}
    </div>
  );
}
