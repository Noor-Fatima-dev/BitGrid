// app/play/demo/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import DotMatrixScreen from "@/app/components/DotMatrixScreen";
import Hud from "@/app/components/Hud";
import { DotMatrixEngine } from "@/src/DotMatrixEngine";
import GameEngine from "@/src/GameEngine";
import { ENGINE_CONFIG } from "@/src/engineTypes";
import { pixelFont } from "@/app/fonts";

const emptyGrid = () =>
  Array.from({ length: ENGINE_CONFIG.ROWS }, () => Array(ENGINE_CONFIG.COLS).fill(false));

// Standalone demo scene — real published scenes will load by id from a
// backend once one exists. This route only exists to show what the public
// play shell looks like: no editor chrome, just the board.
function buildDemoScene(engine: GameEngine) {
  engine.create("STATIC_PLAYER", "HERO", [[true, true], [true, true]], 9, 17, 1, 1);
  engine.create("BOUNCING_ENEMY", "BLOB", [[true]], 3, 3, 1, 1);
  engine.create("RESPAWNING_PILL", "DOT", [[true]], 15, 5, 0, 0, { points: 1 });
}

interface PlayerStatus {
  id: string;
  score: number;
  health: number;
  isAlive: boolean;
}

export default function PublicPlayDemo() {
  const [grid, setGrid] = useState<boolean[][]>(emptyGrid);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const engineRef = useRef<DotMatrixEngine | null>(null);
  const gameRef = useRef<GameEngine | null>(null);

  const syncHud = () => {
    const g = gameRef.current;
    if (!g) return;
    setPlayers(g.getAllPlayers().map((p) => ({ id: p.id, score: p.score, health: p.health, isAlive: p.isAlive })));
  };

  const start = () => {
    const matrix = engineRef.current;
    const game = gameRef.current;
    if (!matrix || !game) return;
    matrix.stop();
    matrix.clear();
    game.sprites.clear();
    buildDemoScene(game);
    game.resetPlayers();
    syncHud();

    let stepTimer = 0;
    matrix.start((delta) => {
      stepTimer += delta;
      if (stepTimer > 100) {
        stepTimer = 0;
        game.render();
        syncHud();
      }
    });
  };

  useEffect(() => {
    const matrix = new DotMatrixEngine(ENGINE_CONFIG.ROWS, ENGINE_CONFIG.COLS);
    const game = new GameEngine(matrix);
    engineRef.current = matrix;
    gameRef.current = game;
    matrix.onRender((g) => setGrid(g));
    start();

    return () => matrix.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-4 bg-black p-6 text-white font-mono">
      <h1 className={`${pixelFont.className} text-[11px] text-gray-500`}>MATRIX ARCADE</h1>
      <Hud players={players} />
      <DotMatrixScreen grid={grid} color="red" />
      <button
        onClick={start}
        className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-xs text-gray-300 hover:bg-gray-800 active:scale-95 transition"
      >
        <RotateCcw size={12} />
        Restart
      </button>
    </div>
  );
}