/**
 * Performance optimization utilities for smooth page loading
 */

/**
 * Prefetch a URL in the background
 */
export function prefetchPage(url: string) {
  if (typeof window === "undefined") return;
  
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preconnect to an external domain
 */
export function preconnect(url: string) {
  if (typeof window === "undefined") return;
  
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = url;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if element is in viewport with buffer
 */
export function isInViewport(
  element: HTMLElement,
  buffer: number = 0
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -buffer &&
    rect.left >= -buffer &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + buffer &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + buffer
  );
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback =
  typeof window !== "undefined" &&
  "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(cb, 1);

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback =
  typeof window !== "undefined" &&
  "cancelIdleCallback" in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);
