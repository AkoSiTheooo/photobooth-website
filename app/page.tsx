import Link from "next/link";
import { EarMotif } from "@/components/ear-motif";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export default function GreetingPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <EarMotif className="absolute -right-10 top-10 w-44 rotate-12 opacity-70" tone="sky" />
        <EarMotif className="absolute -left-12 bottom-16 w-52 -rotate-12 opacity-70" tone="butter" />
        <EarMotif className="absolute right-16 bottom-24 w-24 rotate-6" tone="sky" />
      </div>

      <div className="relative w-full max-w-2xl">
        <Wordmark className="animate-in fade-in slide-in-from-bottom-4 text-2xl duration-500" />

        <h1 className="mt-6 animate-in fade-in slide-in-from-bottom-4 font-display text-4xl leading-[1.05] text-ink duration-500 delay-100 sm:text-6xl">
          Four photos, one strip to print.
        </h1>

        <p className="mt-5 max-w-[46ch] animate-in fade-in slide-in-from-bottom-4 text-lg text-ink-soft duration-500 delay-200">
          Step in front of the camera and we count you down. Then pick a frame and
          take your strip home.
        </p>

        {/* TODO: replace with the real event name before launch (R-23 placeholder). */}
        <p className="mt-5 animate-in fade-in duration-500 delay-300">
          <span className="inline-block border-b-2 border-dashed border-line pb-0.5 text-base text-ink-soft">
            Your event name here
          </span>
          <span className="ml-2 text-sm text-ink-soft">placeholder text</span>
        </p>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Button
            asChild
            size="lg"
            className="h-16 w-full rounded-full font-display text-xl font-semibold shadow-none sm:w-auto sm:px-12"
          >
            <Link href="/template">Start the booth</Link>
          </Button>
        </div>

        <p className="mt-8 max-w-[46ch] text-base text-ink-soft">
          Grown-ups: photos are saved for the organizer and can be deleted any time.
        </p>
      </div>
    </main>
  );
}
