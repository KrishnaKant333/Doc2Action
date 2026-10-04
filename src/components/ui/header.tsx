"use client";

import * as React from "react";
import {
  DocumentIcon,
  MenuIcon,
  CheckCircleIcon,
  ClockIcon,
} from "./icons";
import { useNavigation, NavigationTab } from "@/context/NavigationContext";

export function Header() {
  const { activeTab, setActiveTab } = useNavigation();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const itemsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  const navItems = [
    {
      id: "analyzer" as NavigationTab,
      label: "Document Analyzer",
      icon: DocumentIcon,
    },
    {
      id: "actions" as NavigationTab,
      label: "My Actions",
      icon: CheckCircleIcon,
    },
    {
      id: "history" as NavigationTab,
      label: "Recent Documents",
      icon: ClockIcon,
    },
  ];

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape and return focus to toggle button
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          itemsRef.current[0]?.focus();
        }, 50);
      }
    }
  };

  const handleItemKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % navItems.length;
      itemsRef.current[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + navItems.length) % navItems.length;
      itemsRef.current[prevIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemsRef.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemsRef.current[navItems.length - 1]?.focus();
    }
  };

  return (
    <header className="sticky top-3 sm:top-5 z-30 w-full px-3 sm:px-6 lg:px-8 flex justify-center pointer-events-none">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-3xl bg-[#08120c]/85 backdrop-blur-md border border-[rgba(120,160,100,0.15)] shadow-[0_12px_36px_rgba(0,0,0,0.5)] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6 lg:gap-10 transition-all duration-200"
      >
        {/* Left Side: Hamburger & Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Hamburger Menu Container */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              ref={buttonRef}
              onClick={() => setIsOpen((prev) => !prev)}
              onKeyDown={handleButtonKeyDown}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="main-navigation-menu"
              aria-haspopup="true"
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]/60 ${
                isOpen
                  ? "bg-[#132217] text-[#e8ff47] border border-[rgba(140,170,120,0.35)] shadow-[0_0_12px_rgba(232,255,71,0.15)]"
                  : "bg-[#0e1911] text-zinc-300 hover:text-zinc-100 hover:bg-[#132217] border border-[rgba(140,170,120,0.16)] shadow-2xs"
              }`}
            >
              <MenuIcon size={18} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div
                id="main-navigation-menu"
                role="menu"
                aria-label="Main navigation options"
                className="absolute left-0 top-full mt-2.5 w-60 sm:w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#08120c]/95 backdrop-blur-xl border border-[rgba(140,170,120,0.2)] shadow-[0_16px_40px_rgba(0,0,0,0.7)] p-1.5 z-50 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150"
              >
                {navItems.map((item, idx) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      ref={(el) => {
                        itemsRef.current[idx] = el;
                      }}
                      onClick={() => handleSelectTab(item.id)}
                      onKeyDown={(e) => handleItemKeyDown(e, idx)}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]/60 ${
                        isActive
                          ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.24)] font-medium shadow-2xs"
                          : "text-zinc-300 hover:text-zinc-100 hover:bg-[#0e1911]/70 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-[#e8ff47]"
                              : "text-zinc-400 group-hover:text-zinc-200"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {isActive && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#e8ff47] shadow-[0_0_8px_rgba(232,255,71,0.6)] shrink-0 ml-2"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Branding Icon & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.15)] shadow-xs shrink-0">
              <DocumentIcon size={17} />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-serif font-normal text-base sm:text-lg tracking-tight text-zinc-100 leading-tight truncate">
                Doc2Action
              </span>
              <p className="font-serif text-[11px] sm:text-xs text-zinc-400 hidden sm:block leading-tight mt-0.5 truncate">
                Document → Action Automator
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Product Flow (Segmented Glass Treatment with DM Serif typography) */}
        <div
          className="flex items-center gap-1 sm:gap-2 font-serif text-[10px] sm:text-xs md:text-[13px] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-2xl bg-[#e8ff47]/[0.03] border border-[#e8ff47]/[0.12] shadow-inner select-none tracking-wide shrink-0"
          aria-label="Workflow: Document to Understanding to Action"
        >
          <span className="text-emerald-400/70 font-normal">Document</span>
          <span className="text-zinc-600 text-[9px] sm:text-[10px] font-sans" aria-hidden="true">→</span>
          <span className="text-emerald-300 font-normal hidden min-[440px]:inline">Understanding</span>
          <span className="text-zinc-600 text-[9px] sm:text-[10px] font-sans hidden min-[440px]:inline" aria-hidden="true">→</span>
          <span className="text-[#e8ff47] font-medium drop-shadow-[0_0_8px_rgba(232,255,71,0.3)]">
            Action
          </span>
        </div>
      </nav>
    </header>
  );
}
