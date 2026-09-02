// app/studio/behaviorMeta.ts
import { User, Ghost, Pill, Box, Zap, Route, Waypoints, Star, LucideIcon } from "lucide-react";
import { SpriteBehaviorType } from "@/src/GameEngine";

export type PaletteCategory = "Player" | "Enemy" | "Pickup" | "Prop";

export interface BehaviorInfo {
  type: SpriteBehaviorType;
  label: string;
  category: PaletteCategory;
  icon: LucideIcon;
}

export const BEHAVIORS: BehaviorInfo[] = [
  { type: "STATIC_PLAYER", label: "Static Player", category: "Player", icon: User },
  { type: "DYNAMIC_PLAYER", label: "Dynamic Player", category: "Player", icon: Waypoints },
  { type: "BOUNCING_ENEMY", label: "Bouncing Enemy", category: "Enemy", icon: Zap },
  { type: "PATROL_ENEMY", label: "Patrol Enemy", category: "Enemy", icon: Route },
  { type: "RESPAWNING_PILL", label: "Respawning Pill", category: "Pickup", icon: Pill },
  { type: "COUNTED_PILL", label: "Counted Pill", category: "Pickup", icon: Star },
  { type: "PROP", label: "Prop", category: "Prop", icon: Box },
];

export const CATEGORY_ICON: Record<PaletteCategory, LucideIcon> = {
  Player: User,
  Enemy: Ghost,
  Pickup: Pill,
  Prop: Box,
};

// Static class strings — Tailwind can't see classes built with template
// literals like `border-${color}-500` at build time, so each category's
// active style has to be spelled out in full.
export const CATEGORY_STYLE: Record<PaletteCategory, { active: string }> = {
  Player: { active: "border-cyan-500 bg-cyan-950/50 text-cyan-300" },
  Enemy: { active: "border-rose-500 bg-rose-950/50 text-rose-300" },
  Pickup: { active: "border-amber-500 bg-amber-950/50 text-amber-300" },
  Prop: { active: "border-gray-500 bg-gray-800/60 text-gray-300" },
};

export function getBehaviorInfo(type: SpriteBehaviorType): BehaviorInfo {
  return BEHAVIORS.find((b) => b.type === type)!;
}