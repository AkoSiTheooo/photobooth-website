"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";

type PhotoThumbProps = {
  blob: Blob;
  label: string;
  className?: string;
};

const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 240;

// Draws the photo straight from its blob. Object URLs would need revoking, and a
// revoked URL under StrictMode's double mount leaves a broken image behind.
export function PhotoThumb({ blob, label, className }: PhotoThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let bitmap: ImageBitmap | null = null;

    createImageBitmap(blob)
      .then((image) => {
        if (cancelled) {
          image.close();
          return;
        }
        bitmap = image;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const scale = Math.max(THUMB_WIDTH / image.width, THUMB_HEIGHT / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;

        ctx.clearRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);
        ctx.drawImage(
          image,
          (THUMB_WIDTH - drawWidth) / 2,
          (THUMB_HEIGHT - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
      })
      .catch(() => {
        // A thumbnail that cannot be drawn is not worth breaking the page for.
      });

    return () => {
      cancelled = true;
      bitmap?.close();
    };
  }, [blob]);

  return (
    <canvas
      ref={canvasRef}
      width={THUMB_WIDTH}
      height={THUMB_HEIGHT}
      role="img"
      aria-label={label}
      className={cn("aspect-[4/3] w-full object-cover", className)}
    />
  );
}
