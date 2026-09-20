"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BoothValue = {
  shots: Blob[];
  setShots: (shots: Blob[]) => void;
  reset: () => void;
};

// Photos are kept in memory on purpose: they survive moving between the booth
// and the customize page, and a reload asks the visitor to start again.
const BoothContext = createContext<BoothValue | null>(null);

export function BoothProvider({ children }: { children: ReactNode }) {
  const [shots, setShots] = useState<Blob[]>([]);

  const value = useMemo<BoothValue>(
    () => ({ shots, setShots, reset: () => setShots([]) }),
    [shots],
  );

  return (
    <BoothContext.Provider value={value}>{children}</BoothContext.Provider>
  );
}

export function useBooth() {
  const value = useContext(BoothContext);
  if (!value) throw new Error("useBooth must be used inside BoothProvider");
  return value;
}
