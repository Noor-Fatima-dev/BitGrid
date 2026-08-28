"use client";

import { useState } from "react";

export interface Sprite {
  id: string;
  rows: number;
  cols: number;
  data: boolean[][];
}

interface SpriteEditorProps {
  rows?: number;
  cols?: number;
  onSaveSprite?: (sprite: Sprite) => void;
  onExportCode?: (code: string) => void;
}

export default function SpriteEditor({
  rows = 10,
  cols = 10,
  onSaveSprite,
  onExportCode,
}: SpriteEditorProps) {
  // Current editing canvas grid state
  const [grid, setGrid] = useState<boolean[][]>(() =>
    Array.from({ length: rows }, () => Array(cols).fill(false))
  );
  const [spriteId, setSpriteId] = useState<string>("HERO");
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<boolean>(true); // true = ON, false = OFF
  const [savedSprites, setSavedSprites] = useState<Sprite[]>([]);

  // Helper: Crops away empty surrounding padding to extract a tight bounded grid
  const cropToBoundingBox = (fullGrid: boolean[][]): boolean[][] => {
    let minR = fullGrid.length, maxR = -1;
    let minC = fullGrid[0].length, maxC = -1;

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

    // Return 1x1 empty pixel array if canvas is completely empty
    if (maxR === -1) return [[false]];

    const cropped: boolean[][] = [];
    for (let r = minR; r <= maxR; r++) {
      cropped.push(fullGrid[r].slice(minC, maxC + 1));
    }
    return cropped;
  };

  // Toggle single pixel
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

  // Canvas Actions
  const handleClear = () => {
    setGrid(Array.from({ length: rows }, () => Array(cols).fill(false)));
  };

  const handleFill = () => {
    setGrid(Array.from({ length: rows }, () => Array(cols).fill(true)));
  };

  const handleInvert = () => {
    setGrid((prev) => prev.map((row) => row.map((cell) => !cell)));
  };

  // Save Sprite to List (Crops to bounding box automatically)
  const handleSave = () => {
    if (!spriteId.trim()) return;

    const croppedData = cropToBoundingBox(grid);

    const newSprite: Sprite = {
      id: spriteId.trim().toUpperCase(),
      rows: croppedData.length,
      cols: croppedData[0]?.length || 0,
      data: croppedData,
    };

    setSavedSprites((prev) => {
      const filtered = prev.filter((s) => s.id !== newSprite.id);
      return [...filtered, newSprite];
    });

    if (onSaveSprite) onSaveSprite(newSprite);
  };

  // Load selected saved sprite back onto canvas center
  const handleLoadSprite = (sprite: Sprite) => {
    setSpriteId(sprite.id);
    
    // Center the sprite on the full editor canvas
    const newCanvas = Array.from({ length: rows }, () => Array(cols).fill(false));
    const startR = Math.max(0, Math.floor((rows - sprite.rows) / 2));
    const startC = Math.max(0, Math.floor((cols - sprite.cols) / 2));

    for (let r = 0; r < sprite.rows; r++) {
      for (let c = 0; c < sprite.cols; c++) {
        if (startR + r < rows && startC + c < cols) {
          newCanvas[startR + r][startC + c] = sprite.data[r][c];
        }
      }
    }

    setGrid(newCanvas);
  };

  // Export saved sprites as JS / TS object code
  const handleExportAll = () => {
    if (savedSprites.length === 0) return;

    let exportString = `// Generated Sprite Assets\nexport const SPRITES = {\n`;
    savedSprites.forEach((s) => {
      exportString += `  "${s.id}": [\n`;
      s.data.forEach((row) => {
        const rowStr = row.map((val) => (val ? "1" : "0")).join("");
        exportString += `    "${rowStr}",\n`;
      });
      exportString += `  ],\n`;
    });
    exportString += `};\n`;

    if (onExportCode) {
      onExportCode(exportString);
    } else {
      navigator.clipboard.writeText(exportString);
      alert("Sprite code copied to clipboard!");
    }
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
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={() => handlePixelPointerDown(r, c)}
                  onPointerEnter={() => handlePixelPointerEnter(r, c)}
                  className={`h-7 w-7 cursor-pointer rounded-sm border transition-colors ${
                    cell
                      ? "bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "bg-gray-900 border-gray-800 hover:bg-gray-800"
                  }`}
                />
              ))
            )}
          </div>

          {/* QUICK TOOLS */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClear}
              className="rounded bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
            >
              Clear
            </button>
            <button
              onClick={handleFill}
              className="rounded bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
            >
              Fill All
            </button>
            <button
              onClick={handleInvert}
              className="rounded bg-gray-800 px-3 py-1 text-xs hover:bg-gray-700"
            >
              Invert
            </button>
          </div>
        </div>

        {/* SAVED ASSETS & EXPORT PANEL */}
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
                  <div className="flex flex-col">
                    <span className="font-bold">{sprite.id}</span>
                    <span className="text-[10px] text-gray-500">
                      {sprite.cols}x{sprite.rows} px
                    </span>
                  </div>
                  <div
                    className="grid gap-[1px] bg-black p-[2px] rounded border border-gray-800 max-w-[32px] max-h-[32px]"
                    style={{
                      gridTemplateColumns: `repeat(${sprite.cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {sprite.data.flat().map((pixel, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 ${
                          pixel ? "bg-emerald-400" : "bg-gray-900"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleExportAll}
            disabled={savedSprites.length === 0}
            className="mt-3 w-full rounded bg-indigo-600 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            📋 EXPORT CODE
          </button>
        </div>
      </div>
    </div>
  );
}