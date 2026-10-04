import * as React from "react";
import { DocumentIcon } from "./icons";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
            <DocumentIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Doc2Action
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                WCC Launchpad 30
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Document → Action Automator
            </p>
          </div>
        </div>

        {/* Workflow indicator tag */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          <span className="hidden md:inline">Document → Understanding → Action</span>
        </div>
      </div>
    </header>
  );
}
