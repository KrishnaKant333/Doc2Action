import * as React from "react";
import { DocumentIcon } from "./icons";

export function Header() {
  return (
    <header className="sticky top-3 sm:top-5 z-30 w-full px-4 sm:px-6 lg:px-8 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-3xl bg-[#08120c]/85 backdrop-blur-md border border-[rgba(120,160,100,0.15)] shadow-[0_12px_36px_rgba(0,0,0,0.5)] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 lg:gap-10 transition-all duration-200"
      >
        {/* Left Side: Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.15)] shadow-xs shrink-0">
            <DocumentIcon size={17} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-serif font-normal text-base sm:text-lg tracking-tight text-zinc-100 leading-tight">
              Doc2Action
            </span>
            <p className="font-serif text-[11px] sm:text-xs text-zinc-400 hidden sm:block leading-tight mt-0.5">
              Document → Action Automator
            </p>
          </div>
        </div>

        {/* Right Side: Product Flow (Segmented Glass Treatment with DM Serif typography) */}
        <div
          className="flex items-center gap-1.5 sm:gap-2.5 font-serif text-xs sm:text-[13px] px-3 sm:px-4 py-1.5 rounded-2xl bg-[#e8ff47]/[0.03] border border-[#e8ff47]/[0.12] shadow-inner select-none tracking-wide"
          aria-label="Workflow: Document to Understanding to Action"
        >
          <span className="text-emerald-400/70 font-normal">Document</span>
          <span className="text-zinc-600 text-[10px] font-sans" aria-hidden="true">→</span>
          <span className="text-emerald-300 font-normal">Understanding</span>
          <span className="text-zinc-600 text-[10px] font-sans" aria-hidden="true">→</span>
          <span className="text-[#e8ff47] font-medium drop-shadow-[0_0_8px_rgba(232,255,71,0.3)]">
            Action
          </span>
        </div>
      </nav>
    </header>
  );
}
