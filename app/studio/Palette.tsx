// app/studio/Palette.tsx
"use client";

import { BEHAVIORS, CATEGORY_ICON, CATEGORY_STYLE, PaletteCategory } from "./behaviourMeta";
import { SpriteBehaviorType } from "@/src/GameEngine";

interface PaletteProps {
  selected: SpriteBehaviorType;
  onSelect: (type: SpriteBehaviorType) => void;
}

const CATEGORIES: PaletteCategory[] = ["Player", "Enemy", "Pickup", "Prop"];

export default function Palette({ selected, onSelect }: PaletteProps) {
  return (
    <div className="flex w-full flex-col gap-4 sm:w-52">
      {CATEGORIES.map((category) => {
        const CategoryIcon = CATEGORY_ICON[category];
        const items = BEHAVIORS.filter((b) => b.category === category);
        const style = CATEGORY_STYLE[category];

        return (
          <div key={category}>
            <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <CategoryIcon size={13} />
              {category}
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((item) => {
                const active = selected === item.type;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => onSelect(item.type)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition active:scale-[0.98] ${
                      active
                        ? style.active
                        : "border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                    }`}
                  >
                    <ItemIcon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}