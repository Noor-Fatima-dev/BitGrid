"use client";

import { useState } from "react";
import {
  Sprite,
  Player,
  StaticPlayer,
  DynamicPlayer,
  BouncingEnemy,
  PatrolEnemy,
  RespawningPill,
  CountedPill,
  Weapon,
} from "@/src/Sprite";
import { ENGINE_CONFIG, CELL_SIZE } from "@/src/engineTypes";
import GameEngine, { SpriteBehaviorType } from "@/src/GameEngine";

interface SpriteInfo {
  x: number;
  y: number;
  layout: boolean[][];
}

interface SpriteEditorProps {
  gameEngine: GameEngine;
}

const emptyGrid = () =>
  Array.from({ length: ENGINE_CONFIG.ROWS }, () =>
    Array(ENGINE_CONFIG.COLS).fill(false)
  );

const BEHAVIOR_META: Record<
  SpriteBehaviorType,
  { label: string; icon: string; chipActive: string; dot: string }
> = {
  STATIC_PLAYER: {
    label: "Static Player",
    icon: "🧍",
    chipActive: "border-cyan-500 bg-cyan-950/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]",
    dot: "bg-cyan-500",
  },
  DYNAMIC_PLAYER: {
    label: "Dynamic Player",
    icon: "🐍",
    chipActive: "border-cyan-500 bg-cyan-950/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]",
    dot: "bg-cyan-500",
  },
  BOUNCING_ENEMY: {
    label: "Bouncing Enemy",
    icon: "👾",
    chipActive: "border-rose-500 bg-rose-950/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    dot: "bg-rose-500",
  },
  PATROL_ENEMY: {
    label: "Patrol Enemy",
    icon: "🚨",
    chipActive: "border-rose-500 bg-rose-950/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    dot: "bg-rose-500",
  },
  PROP: {
    label: "Prop",
    icon: "📦",
    chipActive: "border-gray-500 bg-gray-800/60 text-gray-300 shadow-[0_0_12px_rgba(156,163,175,0.25)]",
    dot: "bg-gray-500",
  },
  RESPAWNING_PILL: {
    label: "Respawning Pill",
    icon: "🍬",
    chipActive: "border-amber-500 bg-amber-950/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
    dot: "bg-amber-500",
  },
  COUNTED_PILL: {
    label: "Counted Pill",
    icon: "⭐",
    chipActive: "border-amber-500 bg-amber-950/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
    dot: "bg-amber-500",
  },
};

const inferType = (sprite: Sprite): SpriteBehaviorType => {
  if (sprite instanceof DynamicPlayer) return "DYNAMIC_PLAYER";
  if (sprite instanceof StaticPlayer) return "STATIC_PLAYER";
  if (sprite instanceof PatrolEnemy) return "PATROL_ENEMY";
  if (sprite instanceof BouncingEnemy) return "BOUNCING_ENEMY";
  if (sprite instanceof CountedPill) return "COUNTED_PILL";
  if (sprite instanceof RespawningPill) return "RESPAWNING_PILL";
  return "PROP";
};

export default function SpriteEditor({ gameEngine }: SpriteEditorProps) {
  const [grid, setGrid] = useState<boolean[][]>(emptyGrid);
  const [spriteId, setSpriteId] = useState<string>("HERO");
  const [spriteType, setSpriteType] = useState<SpriteBehaviorType>("STATIC_PLAYER");
  const [vx, setVx] = useState<number>(1);
  const [vy, setVy] = useState<number>(1);
  const [axis, setAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [points, setPoints] = useState<number>(1);
  const [equipWeapon, setEquipWeapon] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<boolean>(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((t) => t + 1);

  const savedSprites = gameEngine.getAllSprites();
  const isEditing = editingId !== null && editingId === spriteId.trim();

  const isPlayerType = spriteType === "STATIC_PLAYER" || spriteType === "DYNAMIC_PLAYER";
  const isEnemyType = spriteType === "BOUNCING_ENEMY" || spriteType === "PATROL_ENEMY";
  const needsVelocity = isPlayerType || isEnemyType;
  const needsAxis = spriteType === "PATROL_ENEMY";
  const needsPoints = spriteType === "RESPAWNING_PILL" || spriteType === "COUNTED_PILL";
  const needsWeaponToggle = isPlayerType;

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
    setGrid(emptyGrid());
  };

  const handleSave = () => {
    const id = spriteId.trim();
    const obj = cropToBoundingBox(grid);
    if (!id || !obj) return;

    const extra: { axis?: "horizontal" | "vertical"; points?: number } = {};
    if (needsAxis) extra.axis = axis;
    if (needsPoints) extra.points = points;

    if (gameEngine.hasSprite(id)) {
      gameEngine.updateSprite(id, spriteType, obj.layout, obj.x, obj.y, vx, vy, extra);
    } else {
      gameEngine.create(spriteType, id, obj.layout, obj.x, obj.y, vx, vy, extra);
    }

    if (needsWeaponToggle) {
      const sprite = gameEngine.getSprite(id);
      if (sprite instanceof Player) {
        if (equipWeapon) {
          sprite.equipWeapon(new Weapon(() => sprite.getFirePosition(), [[true]], 0, -1));
        } else {
          sprite.weapon = null;
        }
      }
    }

    setEditingId(id);
    refresh();
    handleClear();
  };

  const handleNew = () => {
    setSpriteId("");
    setEditingId(null);
    setSpriteType("STATIC_PLAYER");
    setVx(1);
    setVy(1);
    setAxis("horizontal");
    setPoints(1);
    setEquipWeapon(false);
    handleClear();
  };

  const handleLoadSprite = (sprite: Sprite) => {
    const type = inferType(sprite);

    setSpriteId(sprite.id);
    setEditingId(sprite.id);
    setSpriteType(type);
    setVx(sprite.vx);
    setVy(sprite.vy);
    setAxis(sprite instanceof PatrolEnemy ? sprite.axis : "horizontal");
    setPoints(
      sprite instanceof RespawningPill || sprite instanceof CountedPill ? sprite.points : 1
    );
    setEquipWeapon(sprite instanceof Player ? sprite.weapon !== null : false);

    const newGrid = emptyGrid();
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

  const handleDeleteSprite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    gameEngine.deleteSprite(id);
    if (editingId === id) {
      handleNew();
    } else {
      refresh();
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col gap-4 bg-black p-3 text-white font-mono select-none sm:p-4"
      onPointerUp={() => setIsMouseDown(false)}
      onPointerLeave={() => setIsMouseDown(false)}
    >
      {/* SINGLE UNIFIED TOP BAR */}
      <div className="flex flex-wrap items-center gap-3 rounded-full border border-gray-800 bg-gray-950 px-4 py-2 shadow-lg">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-800 bg-amber-950/50 text-sm">
          🎨
        </span>
        <span className="hidden text-[10px] uppercase tracking-[0.15em] text-gray-500 sm:inline">
          {ENGINE_CONFIG.ROWS}×{ENGINE_CONFIG.COLS}
        </span>

        <div className="mx-1 hidden h-6 w-px bg-gray-800 sm:block" />

        <input
          type="text"
          value={spriteId}
          onChange={(e) => setSpriteId(e.target.value)}
          placeholder="SPRITE_ID"
          className="w-28 rounded-full bg-gray-900 px-3 py-1.5 text-xs border border-gray-700 text-amber-300 font-bold uppercase focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
        />

        <button
          onClick={handleNew}
          className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-bold hover:bg-gray-800 active:scale-95 transition"
        >
          NEW
        </button>

        <button
          onClick={handleSave}
          className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-black shadow-lg shadow-amber-950/50 hover:bg-amber-500 active:scale-95 transition"
        >
          {isEditing ? "UPDATE" : "SAVE"}
        </button>

        {isEditing && (
          <span className="ml-auto rounded-full border border-amber-800 bg-amber-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400">
            ✎ Editing
          </span>
        )}
      </div>

      {/* BEHAVIOR PILLS */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(BEHAVIOR_META) as SpriteBehaviorType[]).map((type) => {
          const meta = BEHAVIOR_META[type];
          const active = spriteType === type;
          return (
            <button
              key={type}
              onClick={() => setSpriteType(type)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                active
                  ? meta.chipActive
                  : "border-gray-800 bg-gray-950 text-gray-500 hover:border-gray-700 hover:text-gray-300"
              }`}
            >
              <span>{meta.icon}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* CONDITIONAL PARAM PILLS */}
      {(needsVelocity || needsAxis || needsPoints || needsWeaponToggle) && (
        <div className="flex flex-wrap items-center gap-2">
          {needsVelocity && (
            <>
              <div className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-950 px-3 py-1.5 text-[11px]">
                <span className="text-gray-500">VX</span>
                <input
                  type="number"
                  value={vx}
                  onChange={(e) => setVx(Number(e.target.value))}
                  className="w-10 bg-transparent text-amber-300 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-950 px-3 py-1.5 text-[11px]">
                <span className="text-gray-500">VY</span>
                <input
                  type="number"
                  value={vy}
                  onChange={(e) => setVy(Number(e.target.value))}
                  className="w-10 bg-transparent text-amber-300 focus:outline-none"
                />
              </div>
            </>
          )}

          {needsAxis && (
            <div className="flex items-center gap-1 rounded-full border border-gray-800 bg-gray-950 p-1 text-[11px]">
              {(["horizontal", "vertical"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAxis(a)}
                  className={`rounded-full px-3 py-1 font-bold transition ${
                    axis === a ? "bg-amber-950/60 text-amber-300" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {a === "horizontal" ? "↔" : "↕"}
                </button>
              ))}
            </div>
          )}

          {needsPoints && (
            <div className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-950 px-3 py-1.5 text-[11px]">
              <span className="text-gray-500">Points</span>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-10 bg-transparent text-amber-300 focus:outline-none"
              />
            </div>
          )}

          {needsWeaponToggle && (
            <button
              onClick={() => setEquipWeapon((w) => !w)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                equipWeapon
                  ? "border-amber-500 bg-amber-950/50 text-amber-300"
                  : "border-gray-800 bg-gray-950 text-gray-500 hover:text-gray-300"
              }`}
            >
              🔫 Weapon {equipWeapon ? "ON" : "OFF"}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto sm:flex-row sm:overflow-hidden">
        {/* CANVAS */}
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
          <div className="max-w-full overflow-x-auto">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black p-3 shadow-2xl ring-1 ring-inset ring-white/5">
              <div className="rounded-xl border border-gray-900 bg-black p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${ENGINE_CONFIG.COLS}, ${CELL_SIZE}px)`,
                    gap: `${ENGINE_CONFIG.CELL_GAP}px`,
                  }}
                >
                  {grid.map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        onPointerDown={() => handlePixelPointerDown(r, c)}
                        onPointerEnter={() => handlePixelPointerEnter(r, c)}
                        className="cursor-pointer rounded-full transition-colors duration-75"
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: cell ? "#fbbf24" : "rgba(69,26,3,0.4)",
                          boxShadow: cell ? "0 0 12px rgba(251,191,36,0.85)" : "none",
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="mt-4 rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-xs hover:bg-gray-800 active:scale-95 transition"
          >
            Clear
          </button>
        </div>

        {/* SAVED SPRITES — pill rows */}
        <div className="flex w-full flex-col rounded-2xl border border-gray-800 bg-gray-950/60 p-3 sm:w-64">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Saved
            </span>
            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-300">
              {savedSprites.length}
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {savedSprites.length === 0 && (
              <p className="px-2 py-6 text-center text-[11px] text-gray-600">
                Nothing saved yet.
              </p>
            )}

            {savedSprites.map((sprite) => {
              const type = inferType(sprite);
              const meta = BEHAVIOR_META[type];
              return (
                <div
                  key={sprite.id}
                  onClick={() => handleLoadSprite(sprite)}
                  className={`group flex cursor-pointer items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 text-xs transition ${
                    sprite.id === editingId
                      ? "border-amber-500 bg-amber-950/30"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/80"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${meta.dot}`}
                  >
                    {meta.icon}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={`truncate font-bold ${
                        sprite.id === editingId ? "text-amber-300" : "text-gray-200"
                      }`}
                    >
                      {sprite.id}
                    </span>
                    <span className="truncate text-[9px] uppercase tracking-wide text-gray-500">
                      {meta.label} · {sprite.width}×{sprite.height}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSprite(sprite.id, e)}
                    className="shrink-0 text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                    title="Delete sprite"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}