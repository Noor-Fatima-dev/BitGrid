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

const BEHAVIOR_META: Record <
  SpriteBehaviorType,
  { label: string; icon: string; badge: string; dot: string }
> = {
  STATIC_PLAYER: {
    label: "Static Player",
    icon: "🧍",
    badge: "border-cyan-700 bg-cyan-950/40 text-cyan-300",
    dot: "bg-cyan-500",
  },
  DYNAMIC_PLAYER: {
    label: "Dynamic Player (Snake)",
    icon: "🐍",
    badge: "border-cyan-700 bg-cyan-950/40 text-cyan-300",
    dot: "bg-cyan-500",
  },
  BOUNCING_ENEMY: {
    label: "Bouncing Enemy",
    icon: "👾",
    badge: "border-rose-700 bg-rose-950/40 text-rose-300",
    dot: "bg-rose-500",
  },
  PATROL_ENEMY: {
    label: "Patrol Enemy",
    icon: "🚨",
    badge: "border-rose-700 bg-rose-950/40 text-rose-300",
    dot: "bg-rose-500",
  },
  PROP: {
    label: "Prop (static)",
    icon: "📦",
    badge: "border-gray-700 bg-gray-800/60 text-gray-300",
    dot: "bg-gray-500",
  },
  RESPAWNING_PILL: {
    label: "Respawning Pill",
    icon: "🍬",
    badge: "border-amber-700 bg-amber-950/40 text-amber-300",
    dot: "bg-amber-500",
  },
  COUNTED_PILL: {
    label: "Counted Pill",
    icon: "⭐",
    badge: "border-amber-700 bg-amber-950/40 text-amber-300",
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

function ConfigField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </span>
      {children}
    </div>
  );
}

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

  // Which saved sprite (if any) the form currently represents.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bumped after any create/update/delete so the list re-reads the engine.
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

  // ---- CREATE / UPDATE ----
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

  // ---- start a fresh, unsaved sprite ----
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

  // ---- READ (load into form for editing) ----
  const handleLoadSprite = (sprite: Sprite) => {
    const type = inferType(sprite);

    setSpriteId(sprite.id);
    setEditingId(sprite.id);
    setSpriteType(type);
    setVx(sprite.vx);
    setVy(sprite.vy);
    setAxis(sprite instanceof PatrolEnemy ? sprite.axis : "horizontal");
    setPoints(
      sprite instanceof RespawningPill || sprite instanceof CountedPill
        ? sprite.points
        : 1
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

  // ---- DELETE ----
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
      className="flex h-full w-full flex-col bg-gray-900 p-4 text-white font-mono select-none"
      onPointerUp={() => setIsMouseDown(false)}
      onPointerLeave={() => setIsMouseDown(false)}
    >
      {/* HEADER BAR */}
      <div className="mb-4 flex flex-col gap-4 border-b border-gray-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-800 bg-emerald-950/50 text-sm">
              🎨
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-[0.1em] text-emerald-400 uppercase leading-none">
                Visual Sprite Drawer
              </h2>
              <span className="text-[10px] text-gray-500">
                {ENGINE_CONFIG.ROWS}×{ENGINE_CONFIG.COLS} grid · {CELL_SIZE}px cells
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={spriteId}
              onChange={(e) => setSpriteId(e.target.value)}
              placeholder="SPRITE_ID"
              className="w-32 rounded-lg bg-gray-950 px-2.5 py-1.5 text-xs border border-gray-700 text-emerald-300 font-bold uppercase focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
            <button
              onClick={handleNew}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-bold hover:bg-gray-700 active:scale-95 transition"
            >
              NEW
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 active:scale-95 transition"
            >
              {isEditing ? "UPDATE SPRITE" : "SAVE SPRITE"}
            </button>
          </div>
        </div>

        {/* BEHAVIOR CONFIG */}
        <div className="flex flex-wrap items-stretch gap-2.5 rounded-xl border border-gray-800 bg-gray-950/60 p-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]">
          <ConfigField label="Behavior">
            <select
              value={spriteType}
              onChange={(e) => setSpriteType(e.target.value as SpriteBehaviorType)}
              className="rounded bg-gray-950 px-2 py-1 text-xs border border-gray-700 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
            >
              {(Object.keys(BEHAVIOR_META) as SpriteBehaviorType[]).map((type) => (
                <option key={type} value={type}>
                  {BEHAVIOR_META[type].icon} {BEHAVIOR_META[type].label}
                </option>
              ))}
            </select>
          </ConfigField>

          {needsVelocity && (
            <>
              <ConfigField label="Speed X">
                <input
                  type="number"
                  value={vx}
                  onChange={(e) => setVx(Number(e.target.value))}
                  className="w-16 rounded bg-gray-950 px-2 py-1 text-xs border border-gray-700 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </ConfigField>
              <ConfigField label="Speed Y">
                <input
                  type="number"
                  value={vy}
                  onChange={(e) => setVy(Number(e.target.value))}
                  className="w-16 rounded bg-gray-950 px-2 py-1 text-xs border border-gray-700 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </ConfigField>
            </>
          )}

          {needsAxis && (
            <ConfigField label="Axis">
              <select
                value={axis}
                onChange={(e) => setAxis(e.target.value as "horizontal" | "vertical")}
                className="rounded bg-gray-950 px-2 py-1 text-xs border border-gray-700 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </ConfigField>
          )}

          {needsPoints && (
            <ConfigField label="Points">
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-16 rounded bg-gray-950 px-2 py-1 text-xs border border-gray-700 text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </ConfigField>
          )}

          {needsWeaponToggle && (
            <ConfigField label="Weapon">
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={equipWeapon}
                  onChange={(e) => setEquipWeapon(e.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-500"
                />
                🔫 Equip
              </label>
            </ConfigField>
          )}

          {isEditing && (
            <div className="ml-auto flex items-center">
              <span className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                ✎ Editing existing sprite
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* INTERACTIVE DRAWING CANVAS */}
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-gray-800 bg-black p-4">
          <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 p-3 shadow-2xl ring-1 ring-inset ring-white/5">
            <div className="rounded-xl border border-gray-900 bg-gray-950 p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]">
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
                        backgroundColor: cell ? "#34d399" : "rgba(6,78,59,0.35)",
                        boxShadow: cell ? "0 0 12px rgba(52,211,153,0.8)" : "none",
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs hover:bg-gray-700 active:scale-95 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* SAVED ASSETS PANEL */}
        <div className="flex w-64 flex-col rounded-xl border border-gray-800 bg-gray-950 p-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]">
          <div className="mb-2 flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Saved Sprites
            </span>
            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-300">
              {savedSprites.length}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto">
            {savedSprites.length === 0 && (
              <p className="px-1 py-6 text-center text-[11px] text-gray-600">
                Nothing saved yet — draw something and hit Save.
              </p>
            )}

            {savedSprites.map((sprite) => {
              const type = inferType(sprite);
              const meta = BEHAVIOR_META[type];
              return (
                <div
                  key={sprite.id}
                  onClick={() => handleLoadSprite(sprite)}
                  className={`group flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-xs transition ${
                    sprite.id === editingId
                      ? "border-emerald-500 bg-emerald-950/40"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/80"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${meta.dot}`}
                  >
                    {meta.icon}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`truncate font-bold ${
                          sprite.id === editingId ? "text-emerald-300" : "text-gray-200"
                        }`}
                      >
                        {sprite.id}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSprite(sprite.id, e)}
                        className="ml-2 shrink-0 text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                        title="Delete sprite"
                      >
                        ✕
                      </button>
                    </div>
                    <span className={`w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${meta.badge}`}>
                      {meta.label} · {sprite.width}×{sprite.height}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}