import * as React from "react";
import { DocumentIcon } from "./icons";

export function Header() {
  return (
    <header className="sticky top-3 sm:top-4 z-30 w-full px-3 sm:px-4 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto w-fit max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#0c0d16]/80 backdrop-blur-md border border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.45)] px-3.5 sm:px-5 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6 lg:gap-8 transition-all duration-200"
      >
        {/* Left Side: Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs shrink-0">
            <DocumentIcon size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-zinc-100">
                Doc2Action
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                WCC Launchpad 30
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 hidden sm:block leading-tight">
              Document → Action Automator
            </p>
          </div>
        </div>

        {/* Right Side: Product Flow (Segmented Glass Treatment) */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#e8ff47]/[0.03] border border-[#e8ff47]/[0.12] shadow-inner select-none"
          aria-label="Workflow: Document to Understanding to Action"
        >
          <span className="text-emerald-400/70 font-medium">Document</span>
          <span className="text-zinc-600 text-[10px]" aria-hidden="true">→</span>
          <span className="text-emerald-300 font-medium">Understanding</span>
          <span className="text-zinc-600 text-[10px]" aria-hidden="true">→</span>
          <span className="text-[#e8ff47] font-semibold drop-shadow-[0_0_6px_rgba(232,255,71,0.25)]">
            Action
          </span>
        </div>
      </nav>
    </header>
  );
}
