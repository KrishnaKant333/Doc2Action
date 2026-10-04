"use client";

import * as React from "react";

/**
 * InteractiveBackground
 * 
 * Recreates the visual atmosphere of Nexus Studio:
 * - Layer 0: Deep dark background (#04040a)
 * - Layer 1: 60px × 60px subtle grid (1px lines with white at 3% opacity)
 * - Layer 2: 800px × 800px electric lime (#e8ff47) soft cursor-following glow (10% opacity, 120px blur, 1000ms ease-out)
 * 
 * Optimized with direct DOM updates (via useRef + requestAnimationFrame) to prevent React re-renders on pointer movement.
 * Automatically disabled on touch-only devices and when reduced motion is preferred.
 */
export function InteractiveBackground() {
  const blobRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Disable interactive cursor glow if reduced motion is requested
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      return;
    }

    // Disable interactive cursor glow on touch devices without fine mouse pointer
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!pointerQuery.matches) {
      return;
    }

    const blob = blobRef.current;
    if (!blob) return;

    let rafId: number | null = null;
    let latestX = 0;
    let latestY = 0;
    let hasAppeared = false;

    const handlePointerMove = (e: PointerEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;

      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          if (blob) {
            // Centers 800px glow circle around the pointer
            blob.style.transform = `translate3d(${latestX - 400}px, ${latestY - 400}px, 0)`;

            if (!hasAppeared) {
              blob.style.opacity = "0.1";
              hasAppeared = true;
            }
          }
          rafId = null;
        });
      }
    };

    const handleMouseLeave = () => {
      if (blob) {
        blob.style.opacity = "0";
      }
    };

    const handleMouseEnter = () => {
      if (blob && hasAppeared) {
        blob.style.opacity = "0.1";
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#04040a]"
      aria-hidden="true"
    >
      {/* Layer 1: 60px × 60px subtle grid matching Nexus Studio reference */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Layer 2: 800px electric lime (#e8ff47) cursor-following soft glow */}
      <div
        ref={blobRef}
        className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-[#e8ff47] pointer-events-none blur-[120px] will-change-transform opacity-0 hidden [@media(hover:hover)_and_(pointer:fine)]:block motion-reduce:!hidden"
        style={{
          transition: "transform 1000ms ease-out, opacity 500ms ease-out",
        }}
      />
    </div>
  );
}
