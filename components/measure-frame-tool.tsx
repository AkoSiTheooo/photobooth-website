"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type WindowRect = { x: number; y: number; w: number; h: number };

type Detected = WindowRect & { fill: number };

// Alpha at or below this counts as an opening. Anti-aliased edges land above it.
const ALPHA_CUTOFF = 8;
const MIN_AREA_SHARE = 0.001;

export function MeasureFrameTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [windows, setWindows] = useState<Detected[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setWindows([]);
    setFileName(file.name);

    try {
      const url = URL.createObjectURL(file);
      const next = await loadImage(url);
      URL.revokeObjectURL(url);

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !context) throw new Error("No canvas in this browser.");

      canvas.width = next.naturalWidth;
      canvas.height = next.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(next, 0, 0);

      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const found = detectWindows(pixels);
      setImage(next);
      setWindows(found);
      drawPreview(next, found);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That file could not be read.");
    }
  }

  const manifestEntry = {
    key: fileName.replace(/\.[^.]+$/, "") || "my-frame",
    name: "My frame",
    src: `/frames/${fileName || "my-frame.webp"}`,
    width: image?.naturalWidth ?? 600,
    height: image?.naturalHeight ?? 1800,
    layout: "strip4",
    placeholder: false,
    windows: windows.map(({ x, y, w, h }) => ({ x, y, w, h })),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div>
        <label
          htmlFor="frame-file"
          className="block font-display text-lg font-semibold text-ink"
        >
          Frame file
        </label>
        <input
          id="frame-file"
          type="file"
          accept="image/webp,image/png,image/svg+xml"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
          }}
          className="mt-2 block w-full rounded-field border border-line bg-paper p-3 text-base"
        />

        <canvas
          ref={canvasRef}
          className="mt-4 hidden"
          aria-hidden="true"
        />

        <p className="mt-4 text-base text-ink-soft">
          Detected {windows.length} opening{windows.length === 1 ? "" : "s"}.
        </p>

        <canvas
          ref={previewRef}
          className="mt-4 w-full rounded-thumb border border-line bg-white"
          aria-label="Preview of the frame with test panels behind it"
        />

        {error ? (
          <Alert className="mt-4 rounded-field">
            <AlertTitle>That file did not load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {windows.length > 0 && windows.length !== 4 ? (
          <Alert className="mt-4 rounded-field">
            <AlertTitle>Four openings were expected</AlertTitle>
            <AlertDescription>
              This frame has {windows.length}. If the dividers between photos are
              transparent, the tool sees one opening; measure those by hand and paste
              them into the manifest.
            </AlertDescription>
          </Alert>
        ) : null}

        {windows.length === 4 ? (
          <div className="mt-4 rounded-card border border-line/60 bg-card p-4">
            <h2 className="font-display text-lg text-ink">Manifest entry</h2>
            <textarea
              readOnly
              value={JSON.stringify(manifestEntry, null, 2)}
              rows={Math.min(24, windows.length * 2 + 10)}
              className="mt-2 w-full rounded-field border border-line bg-paper p-3 font-mono text-sm"
              aria-label="Manifest entry to paste"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-11 rounded-full px-5"
              onClick={() => {
                void navigator.clipboard.writeText(
                  JSON.stringify(manifestEntry, null, 2),
                );
              }}
            >
              Copy the entry
            </Button>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">How this works</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-base text-ink-soft">
          <li>Drop the frame file in. The tool scans the transparent pixels.</li>
          <li>Check the preview: each photo fills a numbered panel behind the frame.</li>
          <li>Copy the entry into public/frames/manifest.json.</li>
        </ol>
      </div>
    </div>
  );

  function drawPreview(frame: HTMLImageElement, rects: Detected[]) {
    const target = previewRef.current;
    if (!target || rects.length === 0) return;

    target.width = frame.naturalWidth;
    target.height = frame.naturalHeight;
    const context = target.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, target.width, target.height);

    rects.forEach((rect, index) => {
      const colours = ["#a8d8f0", "#f7c8d4", "#ffd98e", "#9a8cc2"];
      context.fillStyle = colours[index % colours.length];
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
      context.fillStyle = "#2a2140";
      context.font = `${Math.round(rect.h / 2)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
    });

    context.drawImage(frame, 0, 0);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be decoded."));
    image.src = src;
  });
}

// Flood fills the transparent pixels, keeps the regions large enough to be photo
// openings, and returns them top to bottom for the manifest.
function detectWindows(pixels: ImageData): Detected[] {
  const { width, height, data } = pixels;
  const transparent = new Uint8Array(width * height);
  for (let index = 0; index < transparent.length; index += 1) {
    transparent[index] = data[index * 4 + 3] <= ALPHA_CUTOFF ? 1 : 0;
  }

  const seen = new Uint8Array(width * height);
  const stack: number[] = [];
  const minArea = Math.floor(width * height * MIN_AREA_SHARE);
  const found: Detected[] = [];

  for (let start = 0; start < transparent.length; start += 1) {
    if (transparent[start] === 0 || seen[start] === 1) continue;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let area = 0;

    stack.push(start);
    seen[start] = 1;

    while (stack.length > 0) {
      const index = stack.pop() as number;
      const x = index % width;
      const y = (index - x) / width;

      area += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (x > 0 && transparent[index - 1] === 1 && seen[index - 1] === 0) {
        seen[index - 1] = 1;
        stack.push(index - 1);
      }
      if (x < width - 1 && transparent[index + 1] === 1 && seen[index + 1] === 0) {
        seen[index + 1] = 1;
        stack.push(index + 1);
      }
      if (y > 0 && transparent[index - width] === 1 && seen[index - width] === 0) {
        seen[index - width] = 1;
        stack.push(index - width);
      }
      if (y < height - 1 && transparent[index + width] === 1 && seen[index + width] === 0) {
        seen[index + width] = 1;
        stack.push(index + width);
      }
    }

    if (area < minArea) continue;

    // One pixel of slack absorbs anti-aliased edges around the opening.
    const x = Math.max(0, minX - 1);
    const y = Math.max(0, minY - 1);
    const w = Math.min(width, maxX + 2) - x;
    const h = Math.min(height, maxY + 2) - y;

    found.push({ x, y, w, h, fill: area / (w * h) });
  }

  return found.sort((a, b) => a.y - b.y);
}
