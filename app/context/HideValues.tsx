"use client";

import { createContext, useContext, useState } from "react";

interface HideValuesCtx {
  hidden: boolean;
  toggle: () => void;
}

const HideValuesContext = createContext<HideValuesCtx>({ hidden: false, toggle: () => {} });

export function HideValuesProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return (
    <HideValuesContext.Provider value={{ hidden, toggle: () => setHidden((h) => !h) }}>
      {children}
    </HideValuesContext.Provider>
  );
}

export function useHideValues() {
  return useContext(HideValuesContext);
}
