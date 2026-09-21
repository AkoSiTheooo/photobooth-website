import Link from "next/link";
import { EarMotif } from "@/components/ear-motif";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

const EVENT_NAME = "PCF Sparkletots @ Buona Vista Blk 54";

const HOW_IT_WORKS = [
  "Use your phone to take your photos.",
  "Save your photo strip to your gallery.",
  "Take as many photos as you want. Have fun!",
];

export default function GreetingPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div className="relative flex px-5 pt-5">
        <Link
          href="/admin/login"
          className="inline-flex min-h-11 items-center text-base text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Admin sign in
        </Link>
      </div>

      <section className="relative flex min-h-[calc(100svh-4rem)] flex-1 flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <EarMotif className="absolute -right-10 top-10 w-44 rotate-12 opacity-70" tone="sky" />
          <EarMotif className="absolute -left-12 bottom-16 w-52 -rotate-12 opacity-70" tone="butter" />
          <EarMotif className="absolute right-16 bottom-24 w-24 rotate-6" tone="sky" />
        </div>

        <div className="relative flex w-full max-w-2xl flex-1 flex-col justify-center self-center px-5 py-12">
          <Wordmark className="animate-in fade-in slide-in-from-bottom-4 text-2xl duration-500" />

          <h1 className="mt-6 animate-in fade-in slide-in-from-bottom-4 font-display text-4xl leading-[1.05] text-ink duration-500 delay-100 sm:text-6xl">
            4 photos, one strip.
          </h1>

          <p className="mt-5 max-w-[46ch] animate-in fade-in slide-in-from-bottom-4 text-lg text-ink-soft duration-500 delay-200">
            Because one photo is never enough! Take your photos, save your strip,
            and keep the memories forever.
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
        </div>
      </section>

      <section className="w-full max-w-2xl self-center px-5 py-12">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">How it works</h2>
        <ul className="mt-6 space-y-4">
          {HOW_IT_WORKS.map((step) => (
            <li key={step} className="flex items-start gap-3 text-lg text-ink">
              <EarMotif className="mt-1 size-6 shrink-0" tone="sky" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="w-full max-w-2xl self-center px-5 pb-20 pt-4">
        <div className="border-t border-line/40 pt-6">
          <p className="text-base font-semibold text-ink">Disclaimer</p>
          <p className="mt-2 text-base text-ink">Exclusive to {EVENT_NAME}.</p>
          <p className="mt-1 max-w-[46ch] text-base text-ink-soft">
            Photos are saved in a Drive for documentation purposes only and will
            not be shared publicly.
          </p>
        </div>
      </footer>
    </main>
  );
}
