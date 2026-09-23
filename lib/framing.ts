// The shape of the booth's camera view. The live preview, the photo thumbnails
// and every frame window are centered on it, so what a visitor sees is what the
// strip keeps.
export const SHOT_ASPECT = 1;

// How the shape is written in copy meant for people.
export const SHOT_ASPECT_LABEL = "1:1";

// How far a window may sit from SHOT_ASPECT before the manifest warns. A share
// of the target, so 0.08 is 8%.
export const ASPECT_WARN_THRESHOLD = 0.08;

export type WindowShape = { w: number; h: number };

export function windowAspect(window: WindowShape) {
  return window.w / window.h;
}

// Positive is wider than the camera view, negative is taller.
export function aspectDeviation(window: WindowShape) {
  return windowAspect(window) / SHOT_ASPECT - 1;
}

// Grows a window around its center until it reaches the capture aspect. Growth
// only: a smaller window would leave part of the measured opening uncovered,
// while growth disappears under the opaque frame art.
export function conformWindowRect<T extends { x: number; y: number; w: number; h: number }>(
  window: T,
): T {
  const w = Math.max(window.w, window.h * SHOT_ASPECT);
  const h = Math.max(window.h, window.w / SHOT_ASPECT);
  return {
    ...window,
    x: window.x - (w - window.w) / 2,
    y: window.y - (h - window.h) / 2,
    w,
    h,
  };
}
