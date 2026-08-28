import { InputManager } from "./InputManager";

export class DotMatrixEngine {
  public readonly rows: number;
  public readonly cols: number;

  // Working grid (where game logic draws)
  private grid: boolean[][];

  // Ping-Pong Render Buffers (allocated once in memory)
  private bufferA: boolean[][];
  private bufferB: boolean[][];
  private useBufferA: boolean = true; // Toggle flag

  // public input: InputManager;
  private onRenderCallback?: (grid: boolean[][]) => void;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  constructor(rows: number = 10, cols: number = 10) {
    this.rows = rows;
    this.cols = cols;

    // Pre-allocate all three 2D arrays once at startup
    this.grid = this.allocateGrid();
    this.bufferA = this.allocateGrid();
    this.bufferB = this.allocateGrid();

    // this.input = new InputManager();
  }

  private allocateGrid(): boolean[][] {
    return Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(false)
    );
  }

  public clear(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = false;
      }
    }
  }

  public setPixel(x: number, y: number, state: boolean = true): void {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.grid[y][x] = state;
    }
  }

  public onRender(callback: (grid: boolean[][]) => void): void {
    this.onRenderCallback = callback;
  }

  public start(updateCallback: (delta: number) => void): void {
    if (this.isRunning) return;

    this.isRunning = true;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;

      const delta = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;

      // 1. Run game update logic
      updateCallback(delta);

      // 2. Ping-Pong Render Swap
      if (this.onRenderCallback) {
        // Select target buffer based on boolean flag
        const targetBuffer = this.useBufferA ? this.bufferA : this.bufferB;

        // Copy working grid data into target buffer
        this.copyGridTo(targetBuffer);

        // Send the target buffer reference to React
        this.onRenderCallback(targetBuffer);

        // Toggle the boolean flag for the next frame
        this.useBufferA = !this.useBufferA;
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Fast in-place memory copy from grid -> target
   */
  private copyGridTo(target: boolean[][]): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        target[r][c] = this.grid[r][c];
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    // this.input.destroy();
  }
}