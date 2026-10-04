"use client";

import * as React from "react";
import {
  DocumentIcon,
  CheckCircleIcon,
  ClockIcon,
} from "./icons";
import { useNavigation, NavigationTab } from "@/context/NavigationContext";

export function Header() {
  const { activeTab, setActiveTab } = useNavigation();
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const navItems = [
    {
      id: "analyzer" as NavigationTab,
      label: "Document Analyzer",
      shortLabel: "Analyzer",
      icon: DocumentIcon,
    },
    {
      id: "actions" as NavigationTab,
      label: "My Actions",
      shortLabel: "My Actions",
      icon: CheckCircleIcon,
    },
    {
      id: "history" as NavigationTab,
      label: "Recent Documents",
      shortLabel: "Recent",
      icon: ClockIcon,
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % navItems.length;
      tabRefs.current[nextIndex]?.focus();
      setActiveTab(navItems[nextIndex].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + navItems.length) % navItems.length;
      tabRefs.current[prevIndex]?.focus();
      setActiveTab(navItems[prevIndex].id);
    }
  };

  return (
    <header className="sticky top-3 sm:top-5 z-30 w-full px-3 sm:px-6 lg:px-8 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-3xl bg-[#08120c]/90 backdrop-blur-md border border-[rgba(120,160,100,0.18)] shadow-[0_12px_36px_rgba(0,0,0,0.55)] px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 transition-all duration-200"
      >
        {/* Left Side: Branding */}
        <button
          type="button"
          onClick={() => setActiveTab("analyzer")}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]/60 rounded-xl p-1 -m-1"
          aria-label="Doc2Action - Return to Document Analyzer"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#0e1911] text-[#e8ff47] border border-[rgba(140,170,120,0.22)] shadow-[0_0_10px_rgba(232,255,71,0.08)] group-hover:border-[#e8ff47]/40 transition-colors shrink-0">
            <DocumentIcon size={17} />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-serif font-normal text-base sm:text-lg tracking-tight text-zinc-100 leading-tight group-hover:text-white transition-colors truncate">
              Doc2Action
            </span>
            <p className="font-serif text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block leading-tight mt-0.5 truncate">
              Document → Action Automator
            </p>
          </div>
        </button>

        {/* Right Side: Navigation Tabs Directly Inside the Navbar */}
        <div
          role="tablist"
          aria-label="Primary navigation"
          className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-[#0e1911]/90 border border-[rgba(140,170,120,0.16)] shadow-inner"
        >
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(item.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]/60 ${
                  isActive
                    ? "bg-[#14261a] text-[#e8ff47] font-medium border border-[rgba(140,170,120,0.32)] shadow-[0_0_12px_rgba(232,255,71,0.15)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#111e15]/70 border border-transparent"
                }`}
              >
                <Icon
                  size={15}
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-[#e8ff47]" : "text-zinc-400"
                  }`}
                />
                <span className="hidden sm:inline font-medium">{item.label}</span>
                <span className="sm:hidden font-medium text-[11px]">{item.shortLabel}</span>

                {isActive && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#e8ff47] shadow-[0_0_6px_rgba(232,255,71,0.8)] shrink-0 hidden min-[480px]:inline-block"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
