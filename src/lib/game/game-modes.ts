/**
 * Ranked game modes — each one compares a different Solana Tracker PNL
 * timeframe. Shared between client (mode picker) and server (matchmaking,
 * PNL fetch, MMR) so there is exactly one place that defines the allowed
 * values — see src/app/api/play/queue/route.ts for where client input is
 * validated against this list before ever touching the database.
 */

export const GAME_MODES = ["ALL_TIME", "THIRTY_DAYS", "SEVEN_DAYS", "ONE_DAY"] as const;

export type GameMode = (typeof GAME_MODES)[number];

export const DEFAULT_GAME_MODE: GameMode = "ALL_TIME";

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (GAME_MODES as readonly string[]).includes(value);
}

export interface GameModeMeta {
  /** Full label used in headings/modals, e.g. "30-DAY PNL". */
  label: string;
  /** Compact label for tight spaces (match HUD, history rows), e.g. "30D". */
  shortLabel: string;
  description: string;
}

export const GAME_MODE_META: Record<GameMode, GameModeMeta> = {
  ALL_TIME: {
    label: "ALL-TIME PNL",
    shortLabel: "ALL-TIME",
    description: "Compare your total All-Time PNL.",
  },
  THIRTY_DAYS: {
    label: "30-DAY PNL",
    shortLabel: "30D",
    description: "Compare your PNL from the last 30 days.",
  },
  SEVEN_DAYS: {
    label: "7-DAY PNL",
    shortLabel: "7D",
    description: "Compare your PNL from the last 7 days.",
  },
  ONE_DAY: {
    label: "1-DAY PNL",
    shortLabel: "1D",
    description: "Compare your PNL from the last 24 hours.",
  },
};
