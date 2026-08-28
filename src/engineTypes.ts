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
  ROWS: 10,
  COLS: 10,
} as const;