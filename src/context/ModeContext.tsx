"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Mode = "pdf" | "image";

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("pdf");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("hypa-mode") as Mode;
    if (savedMode === "pdf" || savedMode === "image") {
      setModeState(savedMode);
    }
    setMounted(true);
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem("hypa-mode", newMode);
  };

  const toggleMode = () => {
    setMode(mode === "pdf" ? "image" : "pdf");
  };

  // Prevent flash by defaulting to server-rendered structure if not mounted yet
  if (!mounted) {
    return <ModeContext.Provider value={{ mode: "pdf", setMode: () => {}, toggleMode: () => {} }}>{children}</ModeContext.Provider>;
  }

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
