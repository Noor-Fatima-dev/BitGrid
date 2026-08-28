import { DotMatrixEngine } from "./DotMatrixEngine";
import { Sprite, InputSprite, BounceBall } from "./Sprite";
import { InputManager } from "./InputManager";

export type SpriteBehaviorType = "INPUT" | "BOUNCE";

export default class GameEngine {
  public matrix: DotMatrixEngine;
  private sprites: Map<string, Sprite> = new Map();
  public input: InputManager;

  constructor(matrix: DotMatrixEngine) {
    this.matrix = matrix;
    this.input = new InputManager();
  }

  public create(
    type: SpriteBehaviorType,
    id: string,
    layout: boolean[][],
    x: number = 0,
    y: number = 0,
    vx: number = 1,
    vy: number = 1
  ): void {
    switch (type) {
      case "INPUT":
        this.registerSprite(new InputSprite(id, layout, x, y, vx, vy, this.input));
        break;
      case "BOUNCE":
        this.registerSprite(new BounceBall(id, layout, x, y, vx, vy));
        break;
      default:
        throw new Error(`Unknown Sprite Type: ${type}`);
    }
  }

  public registerSprite(sprite: Sprite): void {
    this.sprites.set(sprite.id, sprite);
  }

  // src/GameEngine.ts
  public render(): void {
    this.matrix.clear();

    const spriteList = Array.from(this.sprites.values());

    // 1. Update sprite positions
    for (const sprite of spriteList) {
      sprite.update();
    }

    // 2. Check collisions between all pairs
    for (let i = 0; i < spriteList.length; i++) {
      for (let j = i + 1; j < spriteList.length; j++) {
        const spriteA = spriteList[i];
        const spriteB = spriteList[j];

        if (spriteA.collidesWith(spriteB)) {
          this.handleCollision(spriteA, spriteB);
        }
      }
    }

    // 3. Draw active pixels to matrix
    for (const sprite of spriteList) {
      for (let r = 0; r < sprite.height; r++) {
        for (let c = 0; c < sprite.width; c++) {
          if (sprite.layout[r][c]) {
            this.matrix.setPixel(sprite.x + c, sprite.y + r, true);
          }
        }
      }
    }
  }

  private handleCollision(a: Sprite, b: Sprite): void {
    // Simple bounce response for testing
    if (a instanceof BounceBall) {
      a.vy *= -1;
    }
    if (b instanceof BounceBall) {
      b.vy *= -1;
    }
  }

  public destroy(): void {
    this.input.destroy();
  }
}