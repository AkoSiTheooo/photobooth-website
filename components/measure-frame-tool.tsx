"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ASPECT_WARN_THRESHOLD,
  conformWindowRect,
  SHOT_ASPECT,
  SHOT_ASPECT_LABEL,
  windowAspect,
} from "@/lib/framing";

type WindowRect = { x: number; y: number; w: number; h: number };

type Detected = WindowRect & { fill: number };

// A measured opening plus the window the manifest will use: the same rect grown
// to the camera aspect, or kept as measured with a problem to fix by hand.
type ConformResult = { rect: WindowRect; problem: string | null };

// Alpha at or below this counts as an opening. Anti-aliased edges land above it.
const ALPHA_CUTOFF = 8;
const MIN_AREA_SHARE = 0.001;

export function MeasureFrameTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [windows, setWindows] = useState<Detected[]>([]);
  const [conformed, setConformed] = useState<ConformResult[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setWindows([]);
    setConformed([]);
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
      const result = conformWindows(found, canvas.width, canvas.height);
      setImage(next);
      setWindows(found);
      setConformed(result);
      drawPreview(next, result, found);
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
    windows: conformed.map(({ rect }) => rect),
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

        {windows.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
            {windows.map((window, index) => (
              <li key={index}>
                Window {index + 1}: {window.w} x {window.h} (
                {windowAspect(window).toFixed(2)}:1)
                {describeConform(window, conformed[index])}
              </li>
            ))}
          </ul>
        ) : null}

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

        {conformed.some((entry) => entry.problem) ? (
          <Alert className="mt-4 rounded-field">
            <AlertTitle>
              Some openings cannot fit the {SHOT_ASPECT_LABEL} camera view
            </AlertTitle>
            <AlertDescription>
              <ul className="flex list-disc flex-col gap-1 pl-4">
                {conformed.map((entry, index) =>
                  entry.problem ? <li key={index}>{entry.problem}</li> : null,
                )}
              </ul>
              These windows were kept as measured, so the strip crops those photos
              harder than the camera showed.
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

  function drawPreview(
    frame: HTMLImageElement,
    conformed: ConformResult[],
    measured: Detected[],
  ) {
    const target = previewRef.current;
    if (!target || conformed.length === 0) return;

    target.width = frame.naturalWidth;
    target.height = frame.naturalHeight;
    const context = target.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, target.width, target.height);

    conformed.forEach(({ rect }, index) => {
      const colours = ["#a8d8f0", "#f7c8d4", "#ffd98e", "#9a8cc2"];
      context.fillStyle = colours[index % colours.length];
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
      context.fillStyle = "#2a2140";
      context.font = `${Math.round(rect.h / 2)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
    });

    // The measured opening inside the grown window, so it stays visible while
    // checking the frame.
    context.setLineDash([8, 6]);
    context.strokeStyle = "#2a2140";
    context.lineWidth = 2;
    measured.forEach((rect, index) => {
      const grown = conformed[index]?.rect;
      const same =
        grown &&
        grown.x === rect.x &&
        grown.y === rect.y &&
        grown.w === rect.w &&
        grown.h === rect.h;
      if (!same) context.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
    context.setLineDash([]);

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

// Grows each opening to the camera aspect. The growth hides under the opaque
// frame art, so a window is kept as measured only when the grown rect cannot
// stay inside the canvas or would reach into another opening.
function conformWindows(detected: Detected[], width: number, height: number): ConformResult[] {
  return detected.map((measured, index) => {
    const grown = clampToCanvas(pixelBounds(conformWindowRect(measured)), width, height);
    const intrudes = detected.some(
      (other, otherIndex) => otherIndex !== index && overlaps(grown, other),
    );
    const covers =
      grown.x <= measured.x &&
      grown.y <= measured.y &&
      grown.x + grown.w >= measured.x + measured.w &&
      grown.y + grown.h >= measured.y + measured.h;
    const onAspect =
      Math.abs(windowAspect(grown) / SHOT_ASPECT - 1) <= ASPECT_WARN_THRESHOLD;

    if (covers && onAspect && !intrudes) return { rect: grown, problem: null };

    return {
      rect: pixelBounds(measured),
      problem: intrudes
        ? `Window ${index + 1} cannot grow to ${SHOT_ASPECT_LABEL} without reaching into the next opening; leave more art between them.`
        : `Window ${index + 1} cannot grow to ${SHOT_ASPECT_LABEL} inside the canvas; leave more room around the opening.`,
    };
  });
}

// Shifts a window inside the canvas, then caps its size, because the manifest
// rejects windows that poke out.
function clampToCanvas(rect: WindowRect, width: number, height: number): WindowRect {
  const w = Math.min(rect.w, width);
  const h = Math.min(rect.h, height);
  return {
    x: Math.min(Math.max(rect.x, 0), width - w),
    y: Math.min(Math.max(rect.y, 0), height - h),
    w,
    h,
  };
}

// Pixel-aligned outward, so the photo still covers every measured pixel.
function pixelBounds(rect: WindowRect): WindowRect {
  const x = Math.floor(rect.x);
  const y = Math.floor(rect.y);
  return { x, y, w: Math.ceil(rect.x + rect.w) - x, h: Math.ceil(rect.y + rect.h) - y };
}

function overlaps(a: WindowRect, b: WindowRect) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function describeConform(measured: WindowRect, result: ConformResult | undefined) {
  if (!result) return "";
  if (result.problem) return ", kept as measured";

  const { rect } = result;
  const same =
    rect.x === measured.x &&
    rect.y === measured.y &&
    rect.w === measured.w &&
    rect.h === measured.h;
  if (same) return `, already ${SHOT_ASPECT_LABEL}`;
  return `, grown to ${rect.w} x ${rect.h} for ${SHOT_ASPECT_LABEL}`;
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
