import { notFound } from "next/navigation";
import { MeasureFrameTool } from "@/components/measure-frame-tool";

// Dev-only: this tool exists to measure frame overlays, not to be shipped.
export default function MeasureFramePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl text-ink">Measure a frame</h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
        This page finds the photo windows inside a frame file and writes the manifest
        entry for it. It only exists while the site runs in development.
      </p>
      <div className="mt-8">
        <MeasureFrameTool />
      </div>
    </main>
  );
}
