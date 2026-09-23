import {
  ASPECT_WARN_THRESHOLD,
  conformWindowRect,
  SHOT_ASPECT,
  SHOT_ASPECT_LABEL,
  windowAspect,
} from "./framing";

// Shared by the measure tool in the browser and scripts/align-frames.ts in
// Node, so a frame measures the same either way. Keep it free of DOM imports.

export type WindowRect = { x: number; y: number; w: number; h: number };

export type Detected = WindowRect & { fill: number };

// A measured opening plus the window the manifest will use: the same rect grown
// to the camera aspect, or kept as measured with a problem to fix by hand.
export type ConformResult = { rect: WindowRect; problem: string | null };

// Alpha at or below this counts as an opening. Anti-aliased edges land above it.
export const ALPHA_CUTOFF = 8;
export const MIN_AREA_SHARE = 0.001;

// Grows each opening to the camera aspect. The growth hides under the opaque
// frame art, so a window is kept as measured only when the grown rect cannot
// stay inside the canvas or would reach into another opening.
export function conformWindows(
  detected: Detected[],
  width: number,
  height: number,
): ConformResult[] {
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

export function describeConform(measured: WindowRect, result: ConformResult | undefined) {
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
export function detectWindows(pixels: {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}): Detected[] {
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
