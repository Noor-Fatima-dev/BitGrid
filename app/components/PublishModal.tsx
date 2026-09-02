"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";

interface PublishModalProps {
  sceneName: string;
  onClose: () => void;
}

export default function PublishModal({ sceneName, onClose }: PublishModalProps) {
  const [copied, setCopied] = useState(false);

  // Placeholder only — no backend yet, so nothing is actually live at this
  // URL. This is the finished UI; swapping in a real link is a data change,
  // not a redesign.
  const mockLink = `matrixarcade.dev/play/${sceneName.toLowerCase().replace(/\s+/g, "-") || "demo"}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${mockLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <Share2 size={16} />
            <h2 className="text-sm font-bold uppercase tracking-wide">Publish</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-gray-500">
          Anyone with this link will be able to play your game. Sharing isn't
          live yet — this is a preview of what publishing will look like.
        </p>

        <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-black px-3 py-2.5">
          <span className="flex-1 truncate text-xs text-gray-300">{mockLink}</span>
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-red-500 active:scale-95"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}