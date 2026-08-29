"use client";

import { useState } from "react";
import { Sprite } from "@/src/Sprite";
import { ENGINE_CONFIG } from "@/src/engineTypes";
import GameEngine from "@/src/GameEngine";

interface SpriteInfo {
  x: number;
  y: number;
  layout: boolean[][];
}

interface SpriteEditorProps {
  gameEngine: GameEngine;
}

export default function SpriteEditor({ gameEngine }: SpriteEditorProps) {
  const [grid, setGrid] = useState<boolean[][]>(() =>
    Array.from({ length: ENGINE_CONFIG.ROWS }, () =>
      Array(ENGINE_CONFIG.COLS).fill(false)
    )
  );
  const [spriteId, setSpriteId] = useState<string>("HERO");
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<boolean>(true);

  // Sync saved sprites with GameEngine instance
  const savedSprites = Array.from(gameEngine.sprites.values());

  const cropToBoundingBox = (fullGrid: boolean[][]): SpriteInfo | null => {
    let minR = fullGrid.length,
      maxR = -1;
    let minC = fullGrid[0].length,
      maxC = -1;

    for (let r = 0; r < fullGrid.length; r++) {
      for (let c = 0; c < fullGrid[r].length; c++) {
        if (fullGrid[r][c]) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }

    if (maxR === -1) return null;

    const cropped: boolean[][] = [];
    for (let r = minR; r <= maxR; r++) {
      cropped.push(fullGrid[r].slice(minC, maxC + 1));
    }

    return { x: minC, y: minR, layout: cropped };
  };

  const handlePixelPointerDown = (r: number, c: number) => {
    setIsMouseDown(true);
    const newState = !grid[r][c];
    setDrawMode(newState);
    applyPixel(r, c, newState);
  };

  const handlePixelPointerEnter = (r: number, c: number) => {
    if (isMouseDown) {
      applyPixel(r, c, drawMode);
    }
  };

  const applyPixel = (r: number, c: number, state: boolean) => {
    setGrid((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[r][c] = state;
      return updated;
    });
  };

  const handleClear = () => {
    setGrid(
      Array.from({ length: ENGINE_CONFIG.ROWS }, () =>
        Array(ENGINE_CONFIG.COLS).fill(false)
      )
    );
  };

  const handleSave = () => {
    const obj = cropToBoundingBox(grid);
    if (!spriteId.trim() || !obj) return;

    gameEngine.create("INPUT", spriteId, obj.layout, obj.x, obj.y, 1, 1);
    handleClear();
  };

  const handleLoadSprite = (sprite: Sprite) => {
    setSpriteId(sprite.id);

    // Reconstruct full grid canvas from cropped sprite layout
    const newGrid = Array.from({ length: ENGINE_CONFIG.ROWS }, () =>
      Array(ENGINE_CONFIG.COLS).fill(false)
    );

    for (let r = 0; r < sprite.height; r++) {
      for (let c = 0; c < sprite.width; c++) {
        const targetR = sprite.y + r;
        const targetC = sprite.x + c;
        if (
          targetR < ENGINE_CONFIG.ROWS &&
          targetC < ENGINE_CONFIG.COLS &&
          sprite.layout[r][c]
        ) {
          newGrid[targetR][targetC] = true;
        }
      }
    }

    setGrid(newGrid);
  };

  return (
    <div
      className="flex h-full w-full flex-col bg-gray-900 p-4 text-white font-mono select-none"
      onPointerUp={() => setIsMouseDown(false)}
      onPointerLeave={() => setIsMouseDown(false)}
    >
      {/* HEADER BAR */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-800 pb-3">
        <h2 className="text-sm font-bold tracking-wider text-emerald-400 uppercase">
          🎨 Visual Sprite Drawer
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={spriteId}
            onChange={(e) => setSpriteId(e.target.value)}
            placeholder="SPRITE_ID"
            className="w-32 rounded bg-gray-950 px-2 py-1 text-xs border border-gray-700 text-emerald-300 font-bold uppercase focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSave}
            className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold hover:bg-emerald-500 transition"
          >
            SAVE SPRITE
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* INTERACTIVE DRAWING CANVAS */}
        <div className="flex flex-1 flex-col items-center justify-center bg-black p-4 rounded-lg border border-gray-800">
          <div
            className="grid gap-1 bg-gray-950 p-2 rounded border border-gray-800"
            style={{
              gridTemplateColumns: `repeat(${ENGINE_CONFIG.COLS}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={() => handlePixelPointerDown(r, c)}
                  onPointerEnter={() => handlePixelPointerEnter(r, c)}
                  className={`h-4 w-4 cursor-pointer rounded-sm border transition-colors ${
                    cell
                      ? "bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "bg-gray-900 border-gray-800 hover:bg-gray-800"
                  }`}
                />
              ))
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClear}
              className="rounded bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        {/* SAVED ASSETS PANEL */}
        <div className="flex w-56 flex-col justify-between rounded-lg border border-gray-800 bg-gray-950 p-3">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Saved Sprites ({savedSprites.length})
            </span>

            <div className="mt-2 space-y-2 overflow-y-auto max-h-[300px]">
              {savedSprites.map((sprite) => (
                <div
                  key={sprite.id}
                  onClick={() => handleLoadSprite(sprite)}
                  className={`flex cursor-pointer items-center justify-between rounded border p-2 text-xs transition ${
                    sprite.id === spriteId
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                      : "border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700"
                  }`}
                >
                  <span className="font-bold">{sprite.id}</span>
                  <span className="text-[10px] text-gray-500">
                    {sprite.width}x{sprite.height}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}