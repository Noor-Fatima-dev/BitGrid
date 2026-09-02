"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Share2 } from "lucide-react";
import DotMatrixScreen from "@/app/components/DotMatrixScreen";
import Hud from "@/app/components/Hud";
import PublishModal from "@/app/components/PublishModal";
import { useStudioEngine } from "../StudioContext";
import { ENGINE_CONFIG } from "@/src/engineTypes";
import { pixelFont } from "@/app/fonts";

const emptyGrid = () =>
  Array.from({ length: ENGINE_CONFIG.ROWS }, () => Array(ENGINE_CONFIG.COLS).fill(false));

interface PlayerStatus {
  id: string;
  score: number;
  health: number;
  isAlive: boolean;
}

export default function PreviewPage() {
  const { gameEngine, matrixEngine } = useStudioEngine();
  const [grid, setGrid] = useState<boolean[][]>(emptyGrid);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [gameEvent, setGameEvent] = useState<{ text: string; tone: "win" | "lose" } | null>(null);
  const [showPublish, setShowPublish] = useState(false);

  const syncHud = () => {
    if (!gameEngine) return;
    setPlayers(
      gameEngine
        .getAllPlayers()
        .map((p) => ({ id: p.id, score: p.score, health: p.health, isAlive: p.isAlive }))
    );
  };

  const start = () => {
    if (!gameEngine || !matrixEngine) return;
    matrixEngine.stop();
    matrixEngine.clear();
    gameEngine.resetPlayers();
    setGameEvent(null);
    syncHud();

    let stepTimer = 0;
    matrixEngine.start((delta) => {
      stepTimer += delta;
      if (stepTimer > 100) {
        stepTimer = 0;
        gameEngine.render();
        syncHud();
      }
    });
  };

  useEffect(() => {
    if (!gameEngine || !matrixEngine) return;
    matrixEngine.onRender((g) => setGrid(g));
    gameEngine.onPlayerDied = (player) => setGameEvent({ text: `${player.id} died`, tone: "lose" });
    gameEngine.onPillBatchDepleted = () => setGameEvent({ text: "All pills collected!", tone: "win" });
    start();

    return () => {
      matrixEngine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameEngine, matrixEngine]);

  if (!gameEngine || !matrixEngine) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-xs text-gray-600">
        Booting engine…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen flex-col bg-black text-white font-mono">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-950/90 px-6 py-3 shadow-lg backdrop-blur">
        <Link href="/studio" className="flex items-center gap-2 text-gray-500 hover:text-gray-300">
          <ArrowLeft size={15} />
          <span className="text-xs">Back to Studio</span>
        </Link>
        <h1 className={`${pixelFont.className} text-[11px] text-gray-100`}>PREVIEW</h1>
        <button
          onClick={() => setShowPublish(true)}
          className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-950/50 transition hover:bg-red-500 active:scale-95"
        >
          <Share2 size={13} />
          Publish
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Hud players={players} />
        <DotMatrixScreen grid={grid} color="red" />

        {gameEvent && (
          <div
            className={`rounded-md border px-4 py-2 text-xs shadow-lg ${
              gameEvent.tone === "win"
                ? "border-amber-800 bg-amber-950/80 text-amber-300"
                : "border-rose-800 bg-rose-950/80 text-rose-300"
            }`}
          >
            {gameEvent.text}
          </div>
        )}

        <button
          onClick={start}
          className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-xs text-gray-300 hover:bg-gray-800 active:scale-95 transition"
        >
          <RotateCcw size={12} />
          Restart
        </button>
      </main>

      {showPublish && <PublishModal sceneName="my-game" onClose={() => setShowPublish(false)} />}
    </div>
  );
}