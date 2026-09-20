"use client";

import { useCallback, useEffect, useState } from "react";
import { loadFrames, type FrameDefinition } from "@/lib/frames";

type FramesState = {
  frames: FrameDefinition[];
  loading: boolean;
  error: string | null;
  retry: () => void;
};

export function useFrames(): FramesState {
  const [frames, setFrames] = useState<FrameDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    loadFrames()
      .then((list) => {
        if (cancelled) return;
        setFrames(list);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Frames could not load.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  return { frames, loading, error, retry };
}
