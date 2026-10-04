import * as React from "react";

/**
 * InteractiveBackground
 * 
 * Recreates the dark ambient visual atmosphere of Nexus Studio:
 * - Layer 0: Deep dark background (#04040a)
 * - Layer 1: 60px × 60px subtle grid (1px lines with white at 3% opacity)
 * - Layer 2: Stationary centered ambient lime (#e8ff47) soft atmospheric glow
 *   (Continuous subtle illumination centered behind the main content area, non-reactive to cursor)
 * 
 * Fully non-blocking, accessible, respects prefers-reduced-motion, with pointer-events: none.
 */
export function InteractiveBackground() {
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

      {/* Layer 2: Stationary centered ambient lime (#e8ff47) soft atmospheric glow */}
      <div
        className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[360px] h-[480px] sm:w-[680px] sm:h-[620px] lg:w-[940px] lg:h-[760px] pointer-events-none rounded-full blur-[70px] sm:blur-[90px] lg:blur-[110px] animate-ambient-glow"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.09) 0%,
            rgba(232, 255, 71, 0.055) 32%,
            rgba(232, 255, 71, 0.02) 58%,
            transparent 75%
          )`,
        }}
      />
    </div>
  );
}
