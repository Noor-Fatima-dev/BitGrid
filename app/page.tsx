"use client";

import { useEffect, useRef, useState } from "react";
import { DotMatrixEngine } from "../src/DotMatrixEngine";
import DotMatrixScreen from "./components/DotMatrixScreen";
import GameEngine from "@/src/GameEngine";
import { ENGINE_CONFIG } from "@/src/engineTypes";
import SpriteEditor from "./components/SpriteEditor";

type ActiveTab = "EDITOR" | "SPRITES";

interface PlayerStatus {
  id: string;
  score: number;
  health: number;
  isAlive: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("EDITOR");
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [gameEvent, setGameEvent] = useState<{ text: string; tone: "win" | "lose" } | null>(
    null
  );

  const engineRef = useRef<DotMatrixEngine | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const engine = new DotMatrixEngine(ENGINE_CONFIG.ROWS, ENGINE_CONFIG.COLS);
    const gameEngine = new GameEngine(engine);

    engineRef.current = engine;
    gameEngineRef.current = gameEngine;

    engine.onRender((newGrid) => setGrid(newGrid));

    gameEngine.onPlayerDied = (player) => {
      setGameEvent({ text: `💀 ${player.id} died`, tone: "lose" });
    };
    gameEngine.onPillBatchDepleted = () => {
      setGameEvent({ text: "🏆 All pills collected!", tone: "win" });
    };

    return () => {
      engine.destroy();
    };
  }, []);

  const syncPlayerHud = () => {
    const gameEngine = gameEngineRef.current;
    if (!gameEngine) return;
    setPlayers(
      gameEngine.getAllPlayers().map((p) => ({
        id: p.id,
        score: p.score,
        health: p.health,
        isAlive: p.isAlive,
      }))
    );
  };

  const handleRunGame = () => {
    const engine = engineRef.current;
    const gameEngine = gameEngineRef.current;
    if (!engine || !gameEngine) return;

    engine.stop();
    setErrorMessage(null);
    setGameEvent(null);
    gameEngine.resetPlayers();
    syncPlayerHud();

    try {
      let stepTimer = 0;

      engine.start((delta) => {
        try {
          stepTimer += delta;
          if (stepTimer > 100) {
            stepTimer = 0;
            gameEngine.render();
            syncPlayerHud();
          }
        } catch (runtimeError: any) {
          engine.stop();
          setIsRunning(false);
          setErrorMessage(`Runtime Error: ${runtimeError.message}`);
        }
      });

      setIsRunning(true);
    } catch (compileError: any) {
      setErrorMessage(`Syntax Error: ${compileError.message}`);
    }
  };

  const handleStopGame = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.clear();
    }
    setIsRunning(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-950 text-white font-mono">
      {/* HEADER BAR */}
      <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-6 shadow-lg backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isRunning ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" : "bg-red-500"
              }`}
            />
            <div>
              <h1 className="text-sm font-bold tracking-[0.12em] text-gray-100 uppercase leading-none">
                Matrix Arcade IDE
              </h1>
              <span className="text-[10px] tracking-wide text-gray-500">
                {ENGINE_CONFIG.ROWS}×{ENGINE_CONFIG.COLS} board
              </span>
            </div>
          </div>

          <nav className="flex rounded-lg bg-gray-950 p-1 border border-gray-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => setActiveTab("EDITOR")}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "EDITOR"
                  ? "bg-gray-800 text-emerald-400 shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🕹️ Play Mode
            </button>
            <button
              onClick={() => setActiveTab("SPRITES")}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "SPRITES"
                  ? "bg-gray-800 text-emerald-400 shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎨 Sprite Drawer
            </button>
          </nav>
        </div>

        {activeTab === "EDITOR" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunGame}
              className="rounded-md bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-500 active:scale-95"
            >
              ▶ RUN GAME
            </button>
            <button
              onClick={handleStopGame}
              className="rounded-md bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 transition hover:bg-rose-500 active:scale-95"
            >
              ⏹ STOP
            </button>
          </div>
        )}
      </header>

      {/* WORKSPACE */}
      <main className="flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col items-center justify-center bg-black p-6">
          {activeTab === "SPRITES" && gameEngineRef.current ? (
            <SpriteEditor gameEngine={gameEngineRef.current} />
          ) : (
            <>
              {players.length > 0 && (
                <div className="mb-4 flex flex-wrap justify-center gap-3">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs shadow-lg ${
                        p.isAlive
                          ? "border-gray-800 bg-gray-900"
                          : "border-gray-800 bg-gray-900 opacity-50"
                      }`}
                    >
                      <span className="font-bold text-cyan-300">
                        {p.isAlive ? "🧍" : "💀"} {p.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">HP</span>
                        <div className="h-2 w-20 overflow-hidden rounded bg-gray-800">
                          <div
                            className={`h-full transition-all ${
                              p.health > 50
                                ? "bg-emerald-500"
                                : p.health > 20
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${p.health}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-gray-500">
                        Score <span className="text-emerald-400 font-bold">{p.score}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <DotMatrixScreen grid={grid} />

              {gameEvent && (
                <div
                  className={`mt-4 rounded-md border p-3 text-xs shadow-lg ${
                    gameEvent.tone === "win"
                      ? "border-amber-800 bg-amber-950/80 text-amber-300"
                      : "border-rose-800 bg-rose-950/80 text-rose-300"
                  }`}
                >
                  {gameEvent.text}
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-md border border-rose-800 bg-rose-950/80 p-3 text-xs text-rose-300 shadow-lg">
                  {errorMessage}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}