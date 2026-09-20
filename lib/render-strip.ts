import type { FrameDefinition, FrameWindow } from "@/lib/frames";

const EMPTY_WINDOW_FILL = "#f6ede3";

type ComposeInput = {
  frame: FrameDefinition;
  frameImage: HTMLImageElement;
  /// One entry per window, in order. A null entry stays an empty slot.
  shots: (HTMLImageElement | null)[];
};

// The one place a strip is drawn: photos cover-fit into the frame windows, then
// the frame image sits on top. The live preview and the download share this.
export function composeStrip(
  canvas: HTMLCanvasElement,
  { frame, frameImage, shots }: ComposeInput,
) {
  canvas.width = frame.width;
  canvas.height = frame.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot draw the photo strip.");

  ctx.clearRect(0, 0, frame.width, frame.height);

  frame.windows.forEach((window, index) => {
    ctx.fillStyle = EMPTY_WINDOW_FILL;
    ctx.fillRect(window.x, window.y, window.w, window.h);

    const shot = shots[index];
    if (shot) drawCover(ctx, shot, window);
  });

  ctx.drawImage(frameImage, 0, 0, frame.width, frame.height);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  window: FrameWindow,
) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width === 0 || height === 0) return;

  const scale = Math.max(window.w / width, window.h / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;

  ctx.drawImage(
    image,
    window.x + (window.w - drawWidth) / 2,
    window.y + (window.h - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

export function loadShotImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("A photo could not be loaded."));
    };
    image.src = url;
  });
}

export function stripToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The strip could not be exported."));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  // Revoking straight away cancels the download in Chromium: the browser has to
  // read the blob URL first.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function stripFilename(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("-");
  return `PhotoToy-${stamp}.png`;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array, start: number, end: number) {
  let crc = 0xffffffff;
  for (let i = start; i < end; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findChunk(bytes: Uint8Array, type: string) {
  const target = [
    type.charCodeAt(0),
    type.charCodeAt(1),
    type.charCodeAt(2),
    type.charCodeAt(3),
  ];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]) >>>
      0;
    const matches =
      bytes[offset + 4] === target[0] &&
      bytes[offset + 5] === target[1] &&
      bytes[offset + 6] === target[2] &&
      bytes[offset + 7] === target[3];
    if (matches) return offset;
    offset += 12 + length;
  }
  return -1;
}

// A canvas PNG carries no resolution, so a 600x1800 file reports 72 DPI and a
// print shop has to be told the size. This inserts a 300 DPI pHYs chunk.
export async function pngWithPrintDpi(blob: Blob, dpi = 300): Promise<Blob> {
  const source = new Uint8Array(await blob.arrayBuffer());
  const firstIdat = findChunk(source, "IDAT");
  if (firstIdat < 0) return blob;

  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  chunk[16] = 1; // unit: metre
  view.setUint32(17, crc32(chunk, 4, 17));

  return new Blob(
    [source.subarray(0, firstIdat), chunk, source.subarray(firstIdat)],
    { type: "image/png" },
  );
}
