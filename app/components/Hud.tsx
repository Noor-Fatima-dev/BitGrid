"use client";

import { Heart, Skull, Trophy } from "lucide-react";

interface PlayerStatus {
  id: string;
  score: number;
  health: number;
  isAlive: boolean;
}

export default function Hud({ players }: { players: PlayerStatus[] }) {
  if (players.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {players.map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-3 rounded-full border px-4 py-2 text-xs shadow-lg ${
            p.isAlive ? "border-gray-800 bg-gray-950" : "border-gray-800 bg-gray-950 opacity-50"
          }`}
        >
          <span className="flex items-center gap-1.5 font-bold text-cyan-300">
            {p.isAlive ? <Heart size={13} className="text-cyan-400" /> : <Skull size={13} className="text-gray-500" />}
            {p.id}
          </span>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full transition-all ${
                p.health > 50 ? "bg-emerald-500" : p.health > 20 ? "bg-amber-500" : "bg-rose-600"
              }`}
              style={{ width: `${p.health}%` }}
            />
          </div>
          <span className="flex items-center gap-1 text-gray-500">
            <Trophy size={12} className="text-amber-400" />
            <span className="font-bold text-amber-400">{p.score}</span>
          </span>
        </div>
      ))}
    </div>
  );
}