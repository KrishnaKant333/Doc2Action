"use client";

import * as React from "react";

export interface ScrollToTopProps {
  threshold?: number;
  className?: string;
}

/**
 * ScrollToTop
 * 
 * Distinctive floating glass control with Nexus-inspired lime accents:
 * - Appears after the user scrolls down during document analysis/processing
 * - Smoothly scrolls to the top of the interface
 * - Respects prefers-reduced-motion
 * - High contrast accessibility with keyboard focus and aria-label
 */
export function ScrollToTop({
  threshold = 300,
  className = "",
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > threshold);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  const handleScrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Go to top"
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-2xl bg-[#0c0d16]/85 backdrop-blur-md border border-[#e8ff47]/20 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_12px_rgba(232,255,71,0.15)] text-[#e8ff47] hover:border-[#e8ff47]/50 hover:bg-[#121422]/95 hover:shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(232,255,71,0.3)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a] group ${className}`}
    >
      {/* Upward Arrow Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
      {/* Visual TOP indicator */}
      <span className="text-[9px] font-mono font-semibold tracking-wider text-zinc-300 group-hover:text-[#e8ff47] transition-colors leading-none">
        TOP
      </span>
    </button>
  );
}
