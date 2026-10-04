import * as React from "react";

/**
 * InteractiveBackground
 * 
 * Recreates the dark ambient visual atmosphere of Nexus Studio:
 * - Layer 0: Deep dark background (#04040a)
 * - Layer 1: 60px × 60px subtle grid (1px lines with white at 3% opacity)
 * - Layer 2: 10 stationary ambient lime (#e8ff47) atmospheric glow pools
 *   with clearly preserved dark (#04040a) gaps:
 *   1. Main Central Glow (1050px × 780px, 13% peak) behind main content
 *   2. Top-Left Glow (620px × 540px, 7.5% peak)
 *   3. Top-Right Glow (680px × 580px, 8% peak)
 *   4. Upper-Center Left Glow (480px × 420px, 5.5% peak)
 *   5. Upper-Center Right Glow (520px × 460px, 6% peak)
 *   6. Middle-Left Flank Glow (560px × 500px, 7% peak)
 *   7. Middle-Right Flank Glow (540px × 480px, 6.5% peak)
 *   8. Lower-Left Glow (600px × 520px, 6% peak)
 *   9. Lower-Right Glow (620px × 540px, 6.5% peak)
 *   10. Bottom-Center Glow (580px × 480px, 5% peak)
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

      {/* Layer 2: Ambient glow field with distinct light pools and dark gaps */}

      {/* 1. Main Center Atmospheric Glow (primary visual focus behind content) */}
      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[480px] sm:w-[760px] sm:h-[640px] lg:w-[1050px] lg:h-[780px] pointer-events-none rounded-full blur-[65px] sm:blur-[90px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.13) 0%,
            rgba(232, 255, 71, 0.08) 25%,
            rgba(232, 255, 71, 0.038) 50%,
            rgba(232, 255, 71, 0.012) 68%,
            transparent 78%
          )`,
        }}
      />

      {/* 2. Top-Left Glow Pool */}
      <div
        className="absolute left-[6%] top-[10%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[480px] sm:h-[420px] lg:w-[620px] lg:h-[540px] pointer-events-none rounded-full blur-[60px] sm:blur-[80px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.075) 0%,
            rgba(232, 255, 71, 0.04) 30%,
            rgba(232, 255, 71, 0.015) 55%,
            transparent 72%
          )`,
        }}
      />

      {/* 3. Top-Right Glow Pool */}
      <div
        className="hidden sm:block absolute left-[92%] top-[8%] -translate-x-1/2 -translate-y-1/2 sm:w-[500px] sm:h-[440px] lg:w-[680px] lg:h-[580px] pointer-events-none rounded-full blur-[65px] sm:blur-[85px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.08) 0%,
            rgba(232, 255, 71, 0.045) 30%,
            rgba(232, 255, 71, 0.018) 55%,
            transparent 72%
          )`,
        }}
      />

      {/* 4. Upper-Center Left Glow Pool */}
      <div
        className="hidden lg:block absolute left-[18%] top-[34%] -translate-x-1/2 -translate-y-1/2 lg:w-[480px] lg:h-[420px] pointer-events-none rounded-full blur-[75px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.055) 0%,
            rgba(232, 255, 71, 0.025) 30%,
            rgba(232, 255, 71, 0.01) 55%,
            transparent 70%
          )`,
        }}
      />

      {/* 5. Upper-Center Right Glow Pool */}
      <div
        className="hidden lg:block absolute left-[84%] top-[36%] -translate-x-1/2 -translate-y-1/2 lg:w-[520px] lg:h-[460px] pointer-events-none rounded-full blur-[75px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.06) 0%,
            rgba(232, 255, 71, 0.03) 30%,
            rgba(232, 255, 71, 0.012) 55%,
            transparent 70%
          )`,
        }}
      />

      {/* 6. Middle-Left Flank Glow Pool */}
      <div
        className="absolute left-[4%] top-[58%] -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[440px] sm:h-[400px] lg:w-[560px] lg:h-[500px] pointer-events-none rounded-full blur-[60px] sm:blur-[80px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.07) 0%,
            rgba(232, 255, 71, 0.035) 30%,
            rgba(232, 255, 71, 0.015) 55%,
            transparent 72%
          )`,
        }}
      />

      {/* 7. Middle-Right Flank Glow Pool */}
      <div
        className="hidden sm:block absolute left-[94%] top-[60%] -translate-x-1/2 -translate-y-1/2 sm:w-[420px] sm:h-[380px] lg:w-[540px] lg:h-[480px] pointer-events-none rounded-full blur-[60px] sm:blur-[80px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.065) 0%,
            rgba(232, 255, 71, 0.032) 30%,
            rgba(232, 255, 71, 0.012) 55%,
            transparent 72%
          )`,
        }}
      />

      {/* 8. Lower-Left Glow Pool */}
      <div
        className="hidden lg:block absolute left-[14%] top-[82%] -translate-x-1/2 -translate-y-1/2 lg:w-[600px] lg:h-[520px] pointer-events-none rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.06) 0%,
            rgba(232, 255, 71, 0.03) 30%,
            rgba(232, 255, 71, 0.012) 55%,
            transparent 70%
          )`,
        }}
      />

      {/* 9. Lower-Right Glow Pool */}
      <div
        className="absolute left-[86%] top-[84%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[480px] sm:h-[440px] lg:w-[620px] lg:h-[540px] pointer-events-none rounded-full blur-[60px] sm:blur-[80px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.065) 0%,
            rgba(232, 255, 71, 0.032) 30%,
            rgba(232, 255, 71, 0.014) 55%,
            transparent 70%
          )`,
        }}
      />

      {/* 10. Bottom-Center Subtle Glow Pool */}
      <div
        className="hidden sm:block absolute left-[48%] top-[94%] -translate-x-1/2 -translate-y-1/2 sm:w-[440px] sm:h-[380px] lg:w-[580px] lg:h-[480px] pointer-events-none rounded-full blur-[65px] sm:blur-[85px]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            rgba(232, 255, 71, 0.05) 0%,
            rgba(232, 255, 71, 0.025) 30%,
            rgba(232, 255, 71, 0.01) 55%,
            transparent 70%
          )`,
        }}
      />
    </div>
  );
}
