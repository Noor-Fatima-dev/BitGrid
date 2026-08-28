// InputManager.ts
export class InputManager {
  // Use a fixed Set or flat Map to store key states efficiently
  private activeKeys: Set<string> = new Set();
  
  // Bound handlers stored as references for clean event removal
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    this.activeKeys.add(e.key);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.activeKeys.delete(e.key);
  };

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);
    }
  }

  /**
   * Fast O(1) lookup to check if a key is currently held
   */
  public isKeyPressed(key: string): boolean {
    return this.activeKeys.has(key);
  }

  /**
   * Clean up event listeners to prevent memory leaks when destroying instances
   */
  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
    }
    this.activeKeys.clear();
  }
}