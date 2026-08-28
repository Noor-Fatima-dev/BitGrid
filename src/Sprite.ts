import { InputManager } from "./InputManager";
import { ENGINE_CONFIG } from "./engineTypes";

export abstract class Sprite {
    public id: string;
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public vx: number;
    public vy: number;
    maxX : number;
    maxY : number;

    public layout: boolean[][];


    constructor(id: string, layout: boolean[][], x: number = 0, y: number = 0, vx: number = 1, vy: number = 1) {
        this.id = id;
        this.layout = layout;
        this.width = layout[0]?.length || 0;
        this.height = layout.length;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy
        this.maxX = ENGINE_CONFIG.COLS - this.width
        this.maxY = ENGINE_CONFIG.ROWS - this.height
    }

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    public abstract update(): void;

  public intersects(other: Sprite): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }


  public collidesWith(other: Sprite): boolean {
    if (!this.intersects(other)) return false;

    const overlapLeft = Math.max(this.x, other.x);
    const overlapRight = Math.min(this.x + this.width, other.x + other.width);
    const overlapTop = Math.max(this.y, other.y);
    const overlapBottom = Math.min(this.y + this.height, other.y + other.height);

    // 3. Scan only the overlapping pixel region
    for (let worldY = overlapTop; worldY < overlapBottom; worldY++) {
      for (let worldX = overlapLeft; worldX < overlapRight; worldX++) {
        // Map global world coordinates to local matrix coordinates
        const thisPixel = this.layout[worldY - this.y]?.[worldX - this.x];
        const otherPixel = other.layout[worldY - other.y]?.[worldX - other.x];

        // Collision occurs if active pixels overlap on both sprites
        if (thisPixel && otherPixel) {
          return true;
        }
      }
    }

    return false;
  }
}

export class InputSprite extends Sprite {
    public input: InputManager | null = null;

    constructor(id: string, layout: boolean[][], x: number = 0, y: number = 0, vx: number = 1, vy: number = 1, input: InputManager) {
        super(id, layout, x, y, vx, vy)
        this.input = input;
  
    }

public update(): void {
    if (this.input?.isKeyPressed("ArrowUp"))
      this.y = Math.max(0, this.y - this.vy);
    if (this.input?.isKeyPressed("ArrowDown"))
      this.y = Math.min(this.maxY, this.y + this.vy);
    if (this.input?.isKeyPressed("ArrowLeft"))
      this.x = Math.max(0, this.x - this.vx);
    if (this.input?.isKeyPressed("ArrowRight"))
      this.x = Math.min(this.maxX, this.x + this.vx);
  }
}

export class BounceBall extends Sprite {
    constructor(id: string, layout: boolean[][], x: number = 0, y: number = 0, vx: number = 1, vy: number = 1) {
        super(id, layout, x, y, vx, vy);
    }
public update(): void {
    const maxX = ENGINE_CONFIG.COLS - this.width;
    const maxY = ENGINE_CONFIG.ROWS - this.height;
    if (this.y >= maxY || this.y <= 0) {
      this.vy *= -1;
    }
    if (this.x >= maxX || this.x <= 0) {
      this.vx *= -1;
    }

    this.x += this.vx;
    this.y += this.vy;
  }
}

