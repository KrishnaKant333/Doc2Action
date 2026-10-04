import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/ui/header";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerifDisplay = localFont({
  src: [
    {
      path: "./fonts/DMSerifDisplay-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/DMSerifDisplay-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Doc2Action — Document to Action Automator",
  description:
    "Automated extraction of actionable tasks, deadlines, and events from notices, circulars, and documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#04040a] text-zinc-100 font-sans relative selection:bg-[#e8ff47]/20 selection:text-[#e8ff47]">
        <InteractiveBackground />
        <Header />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
