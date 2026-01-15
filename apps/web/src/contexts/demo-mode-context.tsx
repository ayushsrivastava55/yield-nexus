"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DemoModeContextType {
  demoMode: boolean;
  demoVerified: boolean;
  demoKycTier: number;
  demoKycTierName: string;
  setDemoMode: (enabled: boolean) => void;
  setDemoVerified: (verified: boolean, tier?: number, tierName?: string) => void;
  resetDemo: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_MODE_KEY = "yield-nexus-demo-mode";
const DEMO_VERIFIED_KEY = "yield-nexus-demo-verified";

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(false);
  const [demoVerified, setDemoVerifiedState] = useState(false);
  const [demoKycTier, setDemoKycTierState] = useState(1);
  const [demoKycTierName, setDemoKycTierNameState] = useState("Retail");
  const [, setTick] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      const savedDemoMode = localStorage.getItem(DEMO_MODE_KEY);
      const savedDemoVerified = localStorage.getItem(DEMO_VERIFIED_KEY);

      if (savedDemoMode === "true") {
        setDemoModeState(true);
      }

      if (savedDemoVerified === "true") {
        setDemoVerifiedState(true);
        const savedTier = localStorage.getItem(`${DEMO_VERIFIED_KEY}-tier`);
        const savedTierName = localStorage.getItem(`${DEMO_VERIFIED_KEY}-tierName`);
        if (savedTier) setDemoKycTierState(parseInt(savedTier, 10));
        if (savedTierName) setDemoKycTierNameState(savedTierName);
      }
    };

    loadFromStorage();

    // Listen for storage changes across tabs
    const handleStorageChange = () => {
      loadFromStorage();
      setTick(tick => tick + 1); // Force re-render
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-updated", handleStorageChange);
    };
  }, []);

  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled);
    localStorage.setItem(DEMO_MODE_KEY, enabled.toString());

    // Reset demo verified when demo mode is turned off
    if (!enabled) {
      setDemoVerifiedState(false);
      localStorage.removeItem(DEMO_VERIFIED_KEY);
      localStorage.removeItem(`${DEMO_VERIFIED_KEY}-tier`);
      localStorage.removeItem(`${DEMO_VERIFIED_KEY}-tierName`);
    }

    // Dispatch event for other tabs/components
    window.dispatchEvent(new Event("local-storage-updated"));
  };

  const setDemoVerified = (verified: boolean, tier: number = 1, tierName: string = "Retail") => {
    setDemoVerifiedState(verified);
    setDemoKycTierState(tier);
    setDemoKycTierNameState(tierName);

    if (verified) {
      localStorage.setItem(DEMO_VERIFIED_KEY, "true");
      localStorage.setItem(`${DEMO_VERIFIED_KEY}-tier`, tier.toString());
      localStorage.setItem(`${DEMO_VERIFIED_KEY}-tierName`, tierName);
    } else {
      localStorage.removeItem(DEMO_VERIFIED_KEY);
      localStorage.removeItem(`${DEMO_VERIFIED_KEY}-tier`);
      localStorage.removeItem(`${DEMO_VERIFIED_KEY}-tierName`);
    }

    // Dispatch event for other tabs/components
    window.dispatchEvent(new Event("local-storage-updated"));
  };

  const resetDemo = () => {
    setDemoVerifiedState(false);
    setDemoKycTierState(1);
    setDemoKycTierNameState("Retail");
    localStorage.removeItem(DEMO_VERIFIED_KEY);
    localStorage.removeItem(`${DEMO_VERIFIED_KEY}-tier`);
    localStorage.removeItem(`${DEMO_VERIFIED_KEY}-tierName`);

    // Dispatch event for other tabs/components
    window.dispatchEvent(new Event("local-storage-updated"));
  };

  return (
    <DemoModeContext.Provider
      value={{
        demoMode,
        demoVerified,
        demoKycTier,
        demoKycTierName,
        setDemoMode,
        setDemoVerified,
        resetDemo,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }
  return context;
}
