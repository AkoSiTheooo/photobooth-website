"use client";

import { useEffect, useRef } from "react";
import { loadFrameImage, type FrameDefinition } from "@/lib/frames";
import { composeStrip } from "@/lib/render-strip";
import { cn } from "cn";

type StripCanvasProps = {
  frame: FrameDefinition;
  shots?: (HTMLImageElement | null)[];
  label: string;
  className?: string;
};

export function StripCanvas({
  frame,
  shots = [],
  label,
  className,
}: StripCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadFrameImage(frame)
      .then((frameImage) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        composeStrip(canvas, { frame, frameImage, shots });
      })
      .catch(() => {
        // The page around this preview owns the error message.
      });

    return () => {
      cancelled = true;
    };
  }, [frame, shots]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={cn("block h-auto w-full", className)}
    />
  );
}
