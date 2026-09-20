import type { Metadata } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { BoothProvider } from "@/components/booth-context";

// Fredoka for display and Nunito Sans for body: reasons in DESIGN.md.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhotoToy",
  description:
    "Take four photos in the booth, pick a frame, and download a 2 by 6 inch photo strip to print.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BoothProvider>{children}</BoothProvider>
      </body>
    </html>
  );
}
