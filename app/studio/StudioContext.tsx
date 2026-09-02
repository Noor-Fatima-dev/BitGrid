// app/studio/StudioContext.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DotMatrixEngine } from "@/src/DotMatrixEngine";
import GameEngine from "@/src/GameEngine";
import { ENGINE_CONFIG } from "@/src/engineTypes";

interface StudioContextValue {
  gameEngine: GameEngine | null;
  matrixEngine: DotMatrixEngine | null;
}

const StudioContext = createContext<StudioContextValue>({ gameEngine: null, matrixEngine: null });

/**
 * Owns one GameEngine/DotMatrixEngine instance for the whole /studio
 * segment. Because this lives in studio's layout, navigating between
 * /studio and /studio/preview does NOT remount it — both routes see the
 * exact same live scene.
 */
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const matrixEngineRef = useRef<DotMatrixEngine | null>(null);

  useEffect(() => {
    const matrix = new DotMatrixEngine(ENGINE_CONFIG.ROWS, ENGINE_CONFIG.COLS);
    const engine = new GameEngine(matrix);
    matrixEngineRef.current = matrix;
    gameEngineRef.current = engine;
    setReady(true);

    return () => {
      matrix.destroy();
    };
  }, []);

  return (
    <StudioContext.Provider
      value={{
        gameEngine: ready ? gameEngineRef.current : null,
        matrixEngine: ready ? matrixEngineRef.current : null,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudioEngine() {
  return useContext(StudioContext);
}