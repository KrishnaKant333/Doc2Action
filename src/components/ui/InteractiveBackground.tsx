import * as React from "react";

/**
 * InteractiveBackground
 * 
 * Recreates the dark ambient visual atmosphere of Nexus Studio:
 * - Layer 0: Deep dark background (#04040a)
 * - Layer 1: 60px × 60px subtle grid (1px lines with white at 3% opacity)
 * - Layer 2: Multiple stationary ambient lime (#e8ff47) atmospheric glows:
 *   1. Main Center Glow (~1100px diameter, ~11.5% peak) centered behind main content
 *   2. Top-Right Glow (~920px diameter, ~7.5% peak)
 *   3. Top-Left Glow (~860px diameter, ~6.5% peak)
 *   4. Bottom-Left Glow (~820px diameter, ~5.5% peak)
 *   5. Middle-Right Glow (~760px diameter, ~4.5% peak)
 * 
 * Non-symmetrical, visually balanced, deterministic placement, zero cursor tracking.
 * Fully non-blocking, accessible, with pointer-events: none.
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

      {/* Layer 2: Multiple stationary ambient lime (#e8ff47) atmospheric glows */}

      {/* Glow 1: Main Center Atmospheric Glow (primary focus) */}
      <div
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[460px] h-[520px] sm:w-[820px] sm:h-[720px] lg:w-[1100px] lg:h-[880px] pointer-events-none rounded-full blur-[70px] sm:blur-[110px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.115) 0%,
            rgba(232, 255, 71, 0.075) 25%,
            rgba(232, 255, 71, 0.04) 45%,
            rgba(232, 255, 71, 0.015) 65%,
            transparent 80%
          )`,
        }}
      />

      {/* Glow 2: Top-Right Ambient Glow */}
      <div
        className="absolute -right-[10%] top-[4%] w-[380px] h-[380px] sm:w-[700px] sm:h-[700px] lg:w-[920px] lg:h-[840px] pointer-events-none rounded-full blur-[80px] sm:blur-[140px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.075) 0%,
            rgba(232, 255, 71, 0.045) 30%,
            rgba(232, 255, 71, 0.02) 55%,
            transparent 75%
          )`,
        }}
      />

      {/* Glow 3: Top-Left Ambient Glow */}
      <div
        className="absolute -left-[12%] -top-[6%] w-[360px] h-[360px] sm:w-[680px] sm:h-[680px] lg:w-[860px] lg:h-[800px] pointer-events-none rounded-full blur-[80px] sm:blur-[130px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.065) 0%,
            rgba(232, 255, 71, 0.04) 30%,
            rgba(232, 255, 71, 0.018) 55%,
            transparent 75%
          )`,
        }}
      />

      {/* Glow 4: Bottom-Left Ambient Glow */}
      <div
        className="absolute -left-[8%] top-[72%] w-[340px] h-[340px] sm:w-[620px] sm:h-[620px] lg:w-[820px] lg:h-[740px] pointer-events-none rounded-full blur-[80px] sm:blur-[130px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.055) 0%,
            rgba(232, 255, 71, 0.032) 30%,
            rgba(232, 255, 71, 0.014) 55%,
            transparent 75%
          )`,
        }}
      />

      {/* Glow 5: Middle / Lower-Right Ambient Glow */}
      <div
        className="absolute -right-[8%] top-[62%] w-[320px] h-[320px] sm:w-[580px] sm:h-[580px] lg:w-[760px] lg:h-[700px] pointer-events-none rounded-full blur-[80px] sm:blur-[120px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.045) 0%,
            rgba(232, 255, 71, 0.025) 30%,
            rgba(232, 255, 71, 0.01) 55%,
            transparent 75%
          )`,
        }}
      />
    </div>
  );
}
