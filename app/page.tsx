// app/page.tsx
"use client";

import Link from "next/link";
import { Crosshair, Heart, Paintbrush, Play, Zap } from "lucide-react";
import { pixelFont } from "./fonts";

const FEATURES = [
  { icon: Paintbrush, label: "Sprite Editor" },
  { icon: Zap, label: "Collision Engine" },
  { icon: Heart, label: "Score & Health" },
  { icon: Crosshair, label: "Weapons" },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 animate-[scanline_6s_linear_infinite] bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(255,0,0,0.03)_50%)] bg-[length:100%_4px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.85)_75%)]" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <span className="rounded-full border border-red-800 bg-red-950/40 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">
          Work in progress
        </span>

        <h1
          className={`${pixelFont.className} text-3xl leading-relaxed text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.75)] sm:text-5xl`}
        >
          MATRIX
          <br />
          ARCADE
        </h1>

        <p className="max-w-md text-sm leading-relaxed text-gray-400">
          A pixel-grid game engine. Draw sprites, wire up behavior, test it
          live, then share a link — all on one dot-matrix screen.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-[11px] text-gray-300"
            >
              <f.icon size={13} />
              {f.label}
            </span>
          ))}
        </div>

        <Link
          href="/studio"
          className="group relative mt-4 flex items-center gap-2 rounded-lg border-2 border-red-600 bg-red-950/30 px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.35)] transition hover:bg-red-600 hover:text-white hover:shadow-[0_0_35px_rgba(239,68,68,0.6)] active:scale-95"
        >
          <Play size={14} />
          Enter Studio
        </Link>

        <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-gray-700">
          Built with Next.js · No account needed yet
        </p>
      </div>

      <style jsx global>{`
        @keyframes scanline {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100%;
          }
        }
      `}</style>
    </main>
  );
}