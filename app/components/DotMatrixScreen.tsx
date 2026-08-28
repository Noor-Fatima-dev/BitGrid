"use client";

interface DotMatrixScreenProps {
  grid: boolean[][];
}

export default function DotMatrixScreen({ grid }: DotMatrixScreenProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-gray-950 p-4 shadow-2xl border border-gray-900">
      {grid.map((row, i) => (
        <div key={i} className="flex gap-2">
          {row.map((active, j) => (
            <div
              key={j}
              className={`h-8 w-8 rounded-full transition-colors duration-75 ${
                active
                  ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  : "bg-red-950/40"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}