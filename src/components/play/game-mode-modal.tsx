"use client";

import { useState } from "react";
import { GAME_MODES, GAME_MODE_META, type GameMode } from "@/lib/game/game-modes";

interface GameModeModalProps {
  /** Per-mode MMR shown under each option, so a player knows their standing before committing. */
  mmrByMode: Record<GameMode, number>;
  onConfirm: (mode: GameMode) => void;
  onClose: () => void;
}

export function GameModeModal({ mmrByMode, onConfirm, onClose }: GameModeModalProps) {
  const [selected, setSelected] = useState<GameMode | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-[0.3em] text-muted">RANKED 1V1</span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              CHOOSE GAME MODE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md border border-border p-1.5 text-muted transition-colors duration-150 hover:border-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {GAME_MODES.map((mode) => {
            const meta = GAME_MODE_META[mode];
            const isSelected = selected === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setSelected(mode)}
                className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors duration-150 ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface-2 hover:border-muted"
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-extrabold tracking-wide ${isSelected ? "text-accent" : "text-foreground"}`}
                  >
                    {meta.label}
                  </p>
                  <p className="mt-1 text-xs text-muted">{meta.description}</p>
                  <p className="mt-1.5 text-[11px] font-semibold tracking-wide text-muted">
                    Your MMR: {mmrByMode[mode].toLocaleString()}
                  </p>
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-accent bg-accent" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" className="h-3 w-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
            className="rounded-md bg-accent px-6 py-2.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
