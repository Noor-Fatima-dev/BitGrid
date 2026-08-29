"use client";

import { useEffect, useRef, useState } from "react";
import { DotMatrixEngine } from "../src/DotMatrixEngine";
import DotMatrixScreen from "./components/DotMatrixScreen";
import GameEngine from "@/src/GameEngine";
import { ENGINE_CONFIG } from "@/src/engineTypes";
import SpriteEditor from "./components/SpriteEditor";

type ActiveTab = "EDITOR" | "SPRITES";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("EDITOR");
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const engineRef = useRef<DotMatrixEngine | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const engine = new DotMatrixEngine(ENGINE_CONFIG.ROWS, ENGINE_CONFIG.COLS);
    const gameEngine = new GameEngine(engine);

    engineRef.current = engine;
    gameEngineRef.current = gameEngine;

    engine.onRender((newGrid) => setGrid(newGrid));

    return () => {
      engine.destroy();
    };
  }, []);

  const handleRunGame = () => {
    const engine = engineRef.current;
    const gameEngine = gameEngineRef.current;
    if (!engine || !gameEngine) return;

    engine.stop();
    setErrorMessage(null);

    try {
      let stepTimer = 0;

      engine.start((delta) => {
        try {
          stepTimer += delta;
          if (stepTimer > 100) {
            stepTimer = 0;
            gameEngine.render();
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
      <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                isRunning ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <h1 className="text-sm font-bold tracking-wider text-gray-200 uppercase">
              Matrix Arcade IDE
            </h1>
          </div>

          <nav className="flex rounded-lg bg-gray-950 p-1 border border-gray-800">
            <button
              onClick={() => setActiveTab("EDITOR")}
              className={`rounded-md px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "EDITOR"
                  ? "bg-gray-800 text-emerald-400 shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              💻 Code Editor
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

        <div className="flex items-center gap-4">
          <button
            onClick={handleRunGame}
            className="rounded-md bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95"
          >
            ▶ RUN GAME
          </button>
          <button
            onClick={handleStopGame}
            className="rounded-md bg-rose-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-rose-500 active:scale-95"
          >
            ⏹ STOP
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col items-center justify-center bg-black p-6">
          {activeTab === "SPRITES" && gameEngineRef.current ? (
            <SpriteEditor gameEngine={gameEngineRef.current} />
          ) : (
            <DotMatrixScreen grid={grid} />
          )}
          {errorMessage && (
            <div className="mt-4 rounded-md border border-rose-800 bg-rose-950/80 p-3 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}