// app/studio/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Paintbrush, Play, Square } from "lucide-react";
import DotMatrixScreen from "@/app/components/DotMatrixScreen";
import Hud from "@/app/components/Hud";
import Palette from "./Palette";
import SpriteConfigPanel from "./SpriteConfigPanel";
import { useStudioEngine } from "./StudioContext";
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
import { ENGINE_CONFIG } from "@/src/engineTypes";
import { SpriteBehaviorType } from "@/src/GameEngine";
import { pixelFont } from "@/app/fonts";

type Mode = "BUILD" | "TEST";

interface SpriteInfo {
  x: number;
  y: number;
  layout: boolean[][];
}

interface PlayerStatus {
  id: string;
  score: number;
  health: number;
  isAlive: boolean;
}

const emptyGrid = () =>
  Array.from({ length: ENGINE_CONFIG.ROWS }, () => Array(ENGINE_CONFIG.COLS).fill(false));

const inferType = (sprite: Sprite): SpriteBehaviorType => {
  if (sprite instanceof DynamicPlayer) return "DYNAMIC_PLAYER";
  if (sprite instanceof StaticPlayer) return "STATIC_PLAYER";
  if (sprite instanceof PatrolEnemy) return "PATROL_ENEMY";
  if (sprite instanceof BouncingEnemy) return "BOUNCING_ENEMY";
  if (sprite instanceof CountedPill) return "COUNTED_PILL";
  if (sprite instanceof RespawningPill) return "RESPAWNING_PILL";
  return "PROP";
};

export default function StudioPage() {
  const { gameEngine, matrixEngine } = useStudioEngine();

  const [mode, setMode] = useState<Mode>("BUILD");
  const [grid, setGrid] = useState<boolean[][]>(emptyGrid);
  const [displayGrid, setDisplayGrid] = useState<boolean[][]>(emptyGrid);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [drawMode, setDrawMode] = useState(true);

  const [spriteId, setSpriteId] = useState("HERO");
  const [spriteType, setSpriteType] = useState<SpriteBehaviorType>("STATIC_PLAYER");
  const [vx, setVx] = useState(1);
  const [vy, setVy] = useState(1);
  const [axis, setAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [points, setPoints] = useState(1);
  const [equipWeapon, setEquipWeapon] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((t) => t + 1);

  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [gameEvent, setGameEvent] = useState<{ text: string; tone: "win" | "lose" } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!matrixEngine || !gameEngine) return;
    matrixEngine.onRender((g) => setDisplayGrid(g));
    gameEngine.onPlayerDied = (player) => setGameEvent({ text: `${player.id} died`, tone: "lose" });
    gameEngine.onPillBatchDepleted = () => setGameEvent({ text: "All pills collected!", tone: "win" });
  }, [matrixEngine, gameEngine]);

  const savedSprites = gameEngine?.getAllSprites() ?? [];
  const isEditing = editingId !== null && editingId === spriteId.trim();

  const isPlayerType = spriteType === "STATIC_PLAYER" || spriteType === "DYNAMIC_PLAYER";
  const isEnemyType = spriteType === "BOUNCING_ENEMY" || spriteType === "PATROL_ENEMY";
  const needsVelocity = isPlayerType || isEnemyType;
  const needsAxis = spriteType === "PATROL_ENEMY";
  const needsPoints = spriteType === "RESPAWNING_PILL" || spriteType === "COUNTED_PILL";
  const needsWeaponToggle = isPlayerType;

  const cropToBoundingBox = (fullGrid: boolean[][]): SpriteInfo | null => {
    let minR = fullGrid.length,
      maxR = -1,
      minC = fullGrid[0].length,
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
    for (let r = minR; r <= maxR; r++) cropped.push(fullGrid[r].slice(minC, maxC + 1));
    return { x: minC, y: minR, layout: cropped };
  };

  const applyPixel = (r: number, c: number, state: boolean) => {
    setGrid((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[r][c] = state;
      return updated;
    });
  };

  const handleCellPointerDown = (r: number, c: number) => {
    setIsMouseDown(true);
    const newState = !grid[r][c];
    setDrawMode(newState);
    applyPixel(r, c, newState);
  };

  const handleCellPointerEnter = (r: number, c: number) => {
    if (isMouseDown) applyPixel(r, c, drawMode);
  };

  const handleClear = () => setGrid(emptyGrid());

  const handleSave = () => {
    if (!gameEngine) return;
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
        sprite.weapon = equipWeapon
          ? new Weapon(() => sprite.getFirePosition(), [[true]], 0, -1)
          : null;
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
    setPoints(sprite instanceof RespawningPill || sprite instanceof CountedPill ? sprite.points : 1);
    setEquipWeapon(sprite instanceof Player ? sprite.weapon !== null : false);

    const newGrid = emptyGrid();
    for (let r = 0; r < sprite.height; r++) {
      for (let c = 0; c < sprite.width; c++) {
        const targetR = sprite.y + r;
        const targetC = sprite.x + c;
        if (targetR < ENGINE_CONFIG.ROWS && targetC < ENGINE_CONFIG.COLS && sprite.layout[r][c]) {
          newGrid[targetR][targetC] = true;
        }
      }
    }
    setGrid(newGrid);
  };

  const handleDeleteSprite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    gameEngine?.deleteSprite(id);
    if (editingId === id) handleNew();
    else refresh();
  };

  const syncPlayerHud = () => {
    if (!gameEngine) return;
    setPlayers(
      gameEngine
        .getAllPlayers()
        .map((p) => ({ id: p.id, score: p.score, health: p.health, isAlive: p.isAlive }))
    );
  };

  const handleRun = () => {
    if (!gameEngine || !matrixEngine) return;
    matrixEngine.stop();
    setErrorMessage(null);
    setGameEvent(null);
    gameEngine.resetPlayers();
    syncPlayerHud();
    setMode("TEST");

    try {
      let stepTimer = 0;
      matrixEngine.start((delta) => {
        try {
          stepTimer += delta;
          if (stepTimer > 100) {
            stepTimer = 0;
            gameEngine.render();
            syncPlayerHud();
          }
        } catch (err: any) {
          matrixEngine.stop();
          setMode("BUILD");
          setErrorMessage(`Runtime Error: ${err.message}`);
        }
      });
    } catch (err: any) {
      setErrorMessage(`Syntax Error: ${err.message}`);
      setMode("BUILD");
    }
  };

  const handleStop = () => {
    matrixEngine?.stop();
    matrixEngine?.clear();
    setMode("BUILD");
  };

  if (!gameEngine || !matrixEngine) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-xs text-gray-600">
        Booting engine…
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen w-screen flex-col bg-black text-white font-mono select-none"
      onPointerUp={() => setIsMouseDown(false)}
      onPointerLeave={() => setIsMouseDown(false)}
    >
      {/* TOP BAR */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 bg-gray-950/90 px-6 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-300">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className={`${pixelFont.className} text-[11px] text-gray-100`}>MATRIX ARCADE</h1>
            <span className="text-[10px] tracking-wide text-gray-600">
              {ENGINE_CONFIG.ROWS}×{ENGINE_CONFIG.COLS} · {mode === "BUILD" ? "Building" : "Testing"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "BUILD" ? (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-950/50 transition hover:bg-red-500 active:scale-95"
            >
              <Play size={13} />
              Run
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-5 py-2 text-xs font-bold text-gray-300 transition hover:bg-gray-800 active:scale-95"
            >
              <Square size={13} />
              Stop
            </button>
          )}
          <Link
            href="/studio/preview"
            className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-5 py-2 text-xs font-bold text-gray-300 transition hover:bg-gray-800 active:scale-95"
          >
            <Eye size={13} />
            Preview
          </Link>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-6">
        {mode === "TEST" && <Hud players={players} />}

        <div className="flex w-full max-w-5xl flex-1 flex-col items-start gap-6 lg:flex-row lg:justify-center">
          {mode === "BUILD" && <Palette selected={spriteType} onSelect={setSpriteType} />}

          <div className="flex flex-1 flex-col items-center gap-3">
            <DotMatrixScreen
              grid={mode === "BUILD" ? grid : displayGrid}
              color={mode === "BUILD" ? "amber" : "red"}
              interactive={mode === "BUILD"}
              onCellPointerDown={handleCellPointerDown}
              onCellPointerEnter={handleCellPointerEnter}
            />

            {mode === "BUILD" ? (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-xs text-gray-300 hover:bg-gray-800 active:scale-95 transition"
              >
                <Paintbrush size={12} />
                Clear
              </button>
            ) : (
              <p className="text-[11px] text-gray-600">Editing paused — press Stop to draw again.</p>
            )}

            {gameEvent && (
              <div
                className={`rounded-md border px-4 py-2 text-xs shadow-lg ${
                  gameEvent.tone === "win"
                    ? "border-amber-800 bg-amber-950/80 text-amber-300"
                    : "border-rose-800 bg-rose-950/80 text-rose-300"
                }`}
              >
                {gameEvent.text}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-md border border-rose-800 bg-rose-950/80 px-4 py-2 text-xs text-rose-300 shadow-lg">
                {errorMessage}
              </div>
            )}
          </div>

          {mode === "BUILD" && (
            <SpriteConfigPanel
              spriteId={spriteId}
              onSpriteIdChange={setSpriteId}
              vx={vx}
              onVxChange={setVx}
              vy={vy}
              onVyChange={setVy}
              axis={axis}
              onAxisChange={setAxis}
              points={points}
              onPointsChange={setPoints}
              equipWeapon={equipWeapon}
              onEquipWeaponChange={setEquipWeapon}
              needsVelocity={needsVelocity}
              needsAxis={needsAxis}
              needsPoints={needsPoints}
              needsWeaponToggle={needsWeaponToggle}
              isEditing={isEditing}
              onSave={handleSave}
              onNew={handleNew}
              savedSprites={savedSprites}
              editingId={editingId}
              onLoadSprite={handleLoadSprite}
              onDeleteSprite={handleDeleteSprite}
              inferType={inferType}
            />
          )}
        </div>
      </main>
    </div>
  );
}