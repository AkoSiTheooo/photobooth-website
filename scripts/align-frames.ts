import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  conformWindows,
  describeConform,
  detectWindows,
} from "../lib/frame-align";

type FrameWindow = { x: number; y: number; w: number; h: number };

type FrameEntry = {
  key: string;
  name: string;
  src: string;
  width: number;
  height: number;
  layout: string;
  placeholder: boolean;
  windows: FrameWindow[];
};

type Manifest = { version: number; frames: FrameEntry[] };

const manifestPath = path.join(process.cwd(), "public", "frames", "manifest.json");
const checkOnly = process.argv.includes("--check");

// Measures every frame in the manifest with the same detection and conform code
// the /dev/measure-frame tool uses, so a bulk pass and a manual pass agree.
async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  const updated: FrameEntry[] = [];
  const skipped: string[] = [];
  const report: string[] = [];
  let grown = 0;
  let already = 0;
  let kept = 0;

  for (const frame of manifest.frames) {
    const filePath = path.join(process.cwd(), "public", frame.src.replace(/^\//, ""));
    const { data, info } = await sharp(filePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (info.channels !== 4) {
      throw new Error(`${frame.key}: decoded ${info.channels} channels, expected RGBA.`);
    }
    if (info.width !== frame.width || info.height !== frame.height) {
      throw new Error(
        `${frame.key}: ${frame.src} is ${info.width}x${info.height}, the manifest says ${frame.width}x${frame.height}.`,
      );
    }

    const detected = detectWindows({ width: info.width, height: info.height, data });
    if (detected.length !== 4) {
      skipped.push(`${frame.key}: found ${detected.length} openings, expected 4`);
      updated.push(frame);
      continue;
    }

    const conformed = conformWindows(detected, info.width, info.height);
    report.push(frame.key);
    conformed.forEach((entry, index) => {
      const measured = detected[index];
      const unchanged =
        entry.rect.x === measured.x &&
        entry.rect.y === measured.y &&
        entry.rect.w === measured.w &&
        entry.rect.h === measured.h;

      if (entry.problem) kept += 1;
      else if (unchanged) already += 1;
      else grown += 1;

      const reason = entry.problem ? `: ${entry.problem.replace(/^Window \d+ /, "")}` : "";
      report.push(
        `  window ${index + 1}: ${measured.w}x${measured.h}${describeConform(measured, entry)}${reason}`,
      );
    });

    updated.push({ ...frame, placeholder: false, windows: conformed.map((entry) => entry.rect) });
  }

  const next: Manifest = { ...manifest, frames: updated };
  const nextJson = `${JSON.stringify(next, null, 2)}\n`;

  console.log(report.join("\n"));
  if (skipped.length > 0) {
    console.log("\nNEEDS ATTENTION");
    for (const item of skipped) console.log(`  ${item}`);
  }
  console.log(`\nWindows: ${grown} grown, ${already} already 1:1, ${kept} kept as measured.`);

  if (checkOnly) {
    if (nextJson === readFileSync(manifestPath, "utf8")) {
      console.log("Manifest is up to date.");
      return;
    }
    console.log("Manifest would change. Run without --check to write it.");
    process.exitCode = 1;
    return;
  }

  writeFileSync(manifestPath, nextJson);
  console.log(`Wrote ${path.relative(process.cwd(), manifestPath)}.`);
}

main().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exitCode = 1;
});
