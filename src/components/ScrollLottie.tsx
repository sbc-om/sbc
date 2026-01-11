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

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDirection = currentScrollY > lastScrollY ? 1 : -1;
        
        if (lottieRef.current) {
          const animation = lottieRef.current;
          const totalFrames = animation.getDuration(true) ?? 0;
          if (totalFrames <= 0) {
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }
          
          // Calculate scroll progress (0 to 1) based on viewport height
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const factor = Math.min(Math.max(scrollFactor, 0.05), 5);
          const scrollProgress = Math.min(Math.max(currentScrollY / (maxScroll * factor), 0), 1);
          
          // Map scroll progress to animation frame
          const targetFrame = scrollProgress * totalFrames;
          
          // Smoothly animate to target frame
          animation.goToAndStop(targetFrame, true);
          
          // Optional: Play animation based on scroll direction
          if (scrollDirection > 0) {
            animation.setDirection(1);
          } else {
            animation.setDirection(-1);
          }
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isReady, scrollFactor]);

  return (
    <div className={"w-full max-w-xl mx-auto py-12 relative " + (className ?? "")}>
      <div
        className="relative z-10"
        style={{
          filter: "drop-shadow(0 20px 60px rgba(79, 70, 229, 0.3))",
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-2/20 rounded-full blur-3xl animate-pulse delay-300" />
        </div>
      ) : null}
    </div>
  );
}
