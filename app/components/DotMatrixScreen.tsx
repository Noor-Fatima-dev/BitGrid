"use client";

import { CELL_SIZE, ENGINE_CONFIG, CELL_GLOW } from "@/src/engineTypes";

interface DotMatrixScreenProps {
  grid: boolean[][];
}

export default function DotMatrixScreen({ grid }: DotMatrixScreenProps) {
  const cols = grid[0]?.length ?? 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-3 shadow-2xl ring-1 ring-inset ring-white/5">
      <div className="rounded-xl border border-gray-900 bg-gray-950 p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
            gap: `${ENGINE_CONFIG.CELL_GAP}px`,
          }}
        >
          {grid.map((row, i) =>
            row.map((active, j) => (
              <div
                key={`${i}-${j}`}
                className="rounded-full transition-colors duration-75"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: active ? "#ef4444" : "rgba(127,29,29,0.25)",
                  boxShadow: active ? `0 0 ${CELL_GLOW}px rgba(239,68,68,0.85)` : "none",
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}