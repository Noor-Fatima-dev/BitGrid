"use client";

import { useEffect, useRef, useState } from "react";
import { CELL_SIZE as MAX_CELL_SIZE, ENGINE_CONFIG } from "@/src/engineTypes";

interface DotMatrixScreenProps {
  grid: boolean[][];
  color?: "red" | "amber";
  interactive?: boolean;
  onCellPointerDown?: (row: number, col: number) => void;
  onCellPointerEnter?: (row: number, col: number) => void;
}

const THEME = {
  red: { active: "#ef4444", idle: "rgba(127,29,29,0.25)", glow: "rgba(239,68,68,0.85)" },
  amber: { active: "#fbbf24", idle: "rgba(69,26,3,0.4)", glow: "rgba(251,191,36,0.85)" },
} as const;

export default function DotMatrixScreen({
  grid,
  color = "red",
  interactive = false,
  onCellPointerDown,
  onCellPointerEnter,
}: DotMatrixScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);

  const cols = grid[0]?.length ?? ENGINE_CONFIG.COLS;
  const theme = THEME[color];

  // Responsive: measure available width and shrink cells to fit instead of
  // assuming a fixed footprint always fits (this was the cut-off bug).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const recalc = () => {
      const available = el.clientWidth;
      if (!available) return;
      const fit = Math.floor((available - ENGINE_CONFIG.CELL_GAP * (cols - 1)) / cols);
      setCellSize(Math.max(2, Math.min(MAX_CELL_SIZE, fit)));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cols]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[520px] rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-3 shadow-2xl ring-1 ring-inset ring-white/5"
    >
      <div className="rounded-xl border border-gray-900 bg-black p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] sm:p-4">
        <div
          className="mx-auto grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gap: `${ENGINE_CONFIG.CELL_GAP}px`,
          }}
        >
          {grid.map((row, i) =>
            row.map((active, j) => (
              <div
                key={`${i}-${j}`}
                onPointerDown={interactive ? () => onCellPointerDown?.(i, j) : undefined}
                onPointerEnter={interactive ? () => onCellPointerEnter?.(i, j) : undefined}
                className={`rounded-full transition-colors duration-75 ${interactive ? "cursor-pointer" : ""}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: active ? theme.active : theme.idle,
                  boxShadow: active ? `0 0 ${Math.round(cellSize * 0.85)}px ${theme.glow}` : "none",
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}