// src/InputManager.ts
export class InputManager {
  private activeKeys: Set<string> = new Set();

  // Keys pressed since the last time they were "consumed" via
  // wasJustPressed. Lets one keydown fire (say) a weapon exactly once,
  // instead of once per game tick for as long as the key is held.
  private justPressedKeys: Set<string> = new Set();

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (!this.activeKeys.has(e.key)) {
      this.justPressedKeys.add(e.key);
    }
    this.activeKeys.add(e.key);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.activeKeys.delete(e.key);
    this.justPressedKeys.delete(e.key);
  };

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);
    }
  }

  public isKeyPressed(key: string): boolean {
    return this.activeKeys.has(key);
  }

  /**
   * True exactly once per physical key press, regardless of how long the
   * key is held or how many render ticks pass while it's down. Calling
   * this consumes the flag.
   */
  public wasJustPressed(key: string): boolean {
    if (this.justPressedKeys.has(key)) {
      this.justPressedKeys.delete(key);
      return true;
    }
    return false;
  }

  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
    }
    this.activeKeys.clear();
    this.justPressedKeys.clear();
  }
}