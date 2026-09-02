// app/studio/SpriteConfigPanel.tsx
"use client";

import { Crosshair, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Sprite } from "@/src/Sprite";
import { SpriteBehaviorType } from "@/src/GameEngine";
import { getBehaviorInfo } from "./behaviourMeta";

interface SpriteConfigPanelProps {
  spriteId: string;
  onSpriteIdChange: (v: string) => void;
  vx: number;
  onVxChange: (v: number) => void;
  vy: number;
  onVyChange: (v: number) => void;
  axis: "horizontal" | "vertical";
  onAxisChange: (v: "horizontal" | "vertical") => void;
  points: number;
  onPointsChange: (v: number) => void;
  equipWeapon: boolean;
  onEquipWeaponChange: (v: boolean) => void;
  needsVelocity: boolean;
  needsAxis: boolean;
  needsPoints: boolean;
  needsWeaponToggle: boolean;
  isEditing: boolean;
  onSave: () => void;
  onNew: () => void;
  savedSprites: Sprite[];
  editingId: string | null;
  onLoadSprite: (sprite: Sprite) => void;
  onDeleteSprite: (id: string, e: React.MouseEvent) => void;
  inferType: (sprite: Sprite) => SpriteBehaviorType;
}

export default function SpriteConfigPanel({
  spriteId,
  onSpriteIdChange,
  vx,
  onVxChange,
  vy,
  onVyChange,
  axis,
  onAxisChange,
  points,
  onPointsChange,
  equipWeapon,
  onEquipWeaponChange,
  needsVelocity,
  needsAxis,
  needsPoints,
  needsWeaponToggle,
  isEditing,
  onSave,
  onNew,
  savedSprites,
  editingId,
  onLoadSprite,
  onDeleteSprite,
  inferType,
}: SpriteConfigPanelProps) {
  return (
    <div className="flex w-full flex-col gap-4 sm:w-72">
      {/* Identity + save */}
      <div className="rounded-2xl border border-gray-800 bg-gray-950 p-3">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-gray-500">
          Sprite ID
        </label>
        <input
          type="text"
          value={spriteId}
          onChange={(e) => onSpriteIdChange(e.target.value)}
          placeholder="HERO"
          className="mb-3 w-full rounded-lg border border-gray-800 bg-black px-3 py-2 text-xs font-bold uppercase text-amber-300 focus:outline-none focus:border-amber-500"
        />
        <div className="flex gap-2">
          <button
            onClick={onNew}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 py-2 text-xs font-bold text-gray-300 transition hover:bg-gray-800 active:scale-95"
          >
            <Plus size={13} />
            New
          </button>
          <button
            onClick={onSave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-600 py-2 text-xs font-bold text-black shadow-lg shadow-amber-950/50 transition hover:bg-amber-500 active:scale-95"
          >
            <Save size={13} />
            {isEditing ? "Update" : "Save"}
          </button>
        </div>
        {isEditing && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
            <Pencil size={11} />
            Editing existing sprite
          </div>
        )}
      </div>

      {/* Behavior params */}
      {(needsVelocity || needsAxis || needsPoints || needsWeaponToggle) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-950 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Parameters</span>

          {needsVelocity && (
            <div className="flex gap-2">
              <label className="flex flex-1 items-center justify-between rounded-lg border border-gray-800 bg-black px-3 py-2 text-xs">
                <span className="text-gray-500">Speed X</span>
                <input
                  type="number"
                  value={vx}
                  onChange={(e) => onVxChange(Number(e.target.value))}
                  className="w-10 bg-transparent text-right text-amber-300 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 items-center justify-between rounded-lg border border-gray-800 bg-black px-3 py-2 text-xs">
                <span className="text-gray-500">Speed Y</span>
                <input
                  type="number"
                  value={vy}
                  onChange={(e) => onVyChange(Number(e.target.value))}
                  className="w-10 bg-transparent text-right text-amber-300 focus:outline-none"
                />
              </label>
            </div>
          )}

          {needsAxis && (
            <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-black p-1 text-xs">
              {(["horizontal", "vertical"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => onAxisChange(a)}
                  className={`flex-1 rounded-md py-1.5 font-bold capitalize transition ${
                    axis === a ? "bg-amber-950/60 text-amber-300" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {needsPoints && (
            <label className="flex items-center justify-between rounded-lg border border-gray-800 bg-black px-3 py-2 text-xs">
              <span className="text-gray-500">Points</span>
              <input
                type="number"
                value={points}
                onChange={(e) => onPointsChange(Number(e.target.value))}
                className="w-12 bg-transparent text-right text-amber-300 focus:outline-none"
              />
            </label>
          )}

          {needsWeaponToggle && (
            <button
              onClick={() => onEquipWeaponChange(!equipWeapon)}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition active:scale-95 ${
                equipWeapon
                  ? "border-amber-500 bg-amber-950/50 text-amber-300"
                  : "border-gray-800 bg-black text-gray-500 hover:text-gray-300"
              }`}
            >
              <Crosshair size={13} />
              Weapon {equipWeapon ? "Equipped" : "Off"}
            </button>
          )}
        </div>
      )}

      {/* Saved sprites */}
      <div className="flex flex-1 flex-col rounded-2xl border border-gray-800 bg-gray-950 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Saved</span>
          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-300">
            {savedSprites.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {savedSprites.length === 0 && (
            <p className="px-2 py-6 text-center text-[11px] text-gray-600">Nothing saved yet.</p>
          )}

          {savedSprites.map((sprite) => {
            const info = getBehaviorInfo(inferType(sprite));
            const Icon = info.icon;
            const active = sprite.id === editingId;
            return (
              <div
                key={sprite.id}
                onClick={() => onLoadSprite(sprite)}
                className={`group flex cursor-pointer items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 text-xs transition ${
                  active
                    ? "border-amber-500 bg-amber-950/30"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/80"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-gray-300">
                  <Icon size={13} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={`truncate font-bold ${active ? "text-amber-300" : "text-gray-200"}`}>
                    {sprite.id}
                  </span>
                  <span className="truncate text-[9px] uppercase tracking-wide text-gray-500">
                    {info.label} · {sprite.width}×{sprite.height}
                  </span>
                </div>
                <button
                  onClick={(e) => onDeleteSprite(sprite.id, e)}
                  className="shrink-0 text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                  title="Delete sprite"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}