// src/engineTypes.ts
export const ENGINE_TYPE_DEFINITIONS = `
declare class InputManager {
  /** Checks if a specific keyboard key is currently held down (e.g., 'ArrowUp', 'ArrowLeft', ' '). */
  isKeyPressed(key: string): boolean;
}

declare class DotMatrixEngine {
  readonly rows: number;
  readonly cols: number;
  input: InputManager;

  /** Clears all pixels on the grid (sets them to off/false). */
  clear(): void;

  /** 
   * Sets a specific LED pixel at coordinate (x, y). 
   * @param x Column index (0 to cols - 1)
   * @param y Row index (0 to rows - 1)
   * @param state true to turn on, false to turn off
   */
  setPixel(x: number, y: number, state?: boolean): void;
}
`;

export const ENGINE_CONFIG = {
  ROWS: 20,
  COLS: 20,
  // Total on-screen footprint (px) the board should occupy, regardless of
  // ROWS/COLS. Bump ROWS/COLS up and the grid gets denser (smaller cells)
  // instead of the whole board growing — CELL_SIZE below is derived from
  // this so both screens keep covering the same physical area.
  DISPLAY_SIZE: 480,
  CELL_GAP: 3,
} as const;

const cellFromCols =
  (ENGINE_CONFIG.DISPLAY_SIZE - ENGINE_CONFIG.CELL_GAP * (ENGINE_CONFIG.COLS - 1)) /
  ENGINE_CONFIG.COLS;
const cellFromRows =
  (ENGINE_CONFIG.DISPLAY_SIZE - ENGINE_CONFIG.CELL_GAP * (ENGINE_CONFIG.ROWS - 1)) /
  ENGINE_CONFIG.ROWS;

/**
 * Derived px size of a single cell. Takes the smaller of the row-based and
 * col-based fit so the board stays square-cell and never overflows
 * DISPLAY_SIZE even if ROWS !== COLS.
 */
export const CELL_SIZE = Math.max(2, Math.floor(Math.min(cellFromCols, cellFromRows)));

/**
 * Glow blur radius, scaled to CELL_SIZE — a dense grid's tiny dots don't
 * get swallowed by a blur sized for a sparse grid's big dots, and vice
 * versa.
 */
export const CELL_GLOW = Math.max(3, Math.round(CELL_SIZE * 0.85));