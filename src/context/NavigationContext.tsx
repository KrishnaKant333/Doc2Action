"use client";

import * as React from "react";

export type NavigationTab = "analyzer" | "actions" | "history";

interface NavigationContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

const NavigationContext = React.createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTabState] = React.useState<NavigationTab>("analyzer");

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#actions" || hash === "#my-actions") {
        setActiveTabState("actions");
      } else if (hash === "#recent-documents" || hash === "#history") {
        setActiveTabState("history");
      } else if (!hash) {
        setActiveTabState("analyzer");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const setActiveTab = React.useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      if (tab === "analyzer") {
        if (window.location.hash) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      } else if (tab === "actions") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#actions`
        );
      } else if (tab === "history") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#recent-documents`
        );
      }
    }
  }, []);

  const value = React.useMemo(
    () => ({
      activeTab,
      setActiveTab,
    }),
    [activeTab, setActiveTab]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
