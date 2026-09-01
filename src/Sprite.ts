import { InputManager } from "./InputManager";
import { ENGINE_CONFIG } from "./engineTypes";

export type SpriteCategory = "PLAYER" | "ENEMY" | "PILL" | "BULLET" | "PROP";

export abstract class Sprite {
    public id: string;
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public vx: number;
    public vy: number;
    maxX: number;
    maxY: number;

    public layout: boolean[][];

    public abstract readonly category: SpriteCategory;

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

        for (let worldY = overlapTop; worldY < overlapBottom; worldY++) {
            for (let worldX = overlapLeft; worldX < overlapRight; worldX++) {
                const thisPixel = this.layout[worldY - this.y]?.[worldX - this.x];
                const otherPixel = other.layout[worldY - other.y]?.[worldX - other.x];

                if (thisPixel && otherPixel) {
                    return true;
                }
            }
        }

        return false;
    }
    public getFirePosition(): { x: number; y: number } {
        return {
            x: this.x + Math.floor(this.width / 2),
            y: this.y,
        };
    }
}

export abstract class Player extends Sprite {
    protected input: InputManager;

    public weapon: Weapon | null = null;

    public score: number = 0;
    public health: number = 100;
    public isAlive: boolean = true;

    constructor(
        id: string,
        layout: boolean[][],
        x: number = 0,
        y: number = 0,
        vx: number = 1,
        vy: number = 1,
        input: InputManager
    ) {
        super(id, layout, x, y, vx, vy);
        this.input = input;
    }

    public equipWeapon(weapon: Weapon): void {
        this.weapon = weapon;
    }

    public addScore(amount: number): void {
        this.score += amount;
    }

    public takeDamage(amount: number): boolean {
        if (!this.isAlive) return false;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.isAlive = false;
            return true;
        }
        return false;
    }

    protected getDirection(): { dx: number; dy: number } {
        let dx = 0;
        let dy = 0;
        if (this.input.isKeyPressed("ArrowLeft")) dx = -1;
        else if (this.input.isKeyPressed("ArrowRight")) dx = 1;
        if (this.input.isKeyPressed("ArrowUp")) dy = -1;
        else if (this.input.isKeyPressed("ArrowDown")) dy = 1;
        return { dx, dy };
    }
}

export class StaticPlayer extends Player {
    public readonly category: SpriteCategory = "PLAYER";

    public update(): void {
        if (!this.isAlive) return;
        if (this.input.isKeyPressed("ArrowUp"))
            this.y = Math.max(0, this.y - this.vy);
        if (this.input.isKeyPressed("ArrowDown"))
            this.y = Math.min(this.maxY, this.y + this.vy);
        if (this.input.isKeyPressed("ArrowLeft"))
            this.x = Math.max(0, this.x - this.vx);
        if (this.input.isKeyPressed("ArrowRight"))
            this.x = Math.min(this.maxX, this.x + this.vx);
    }
}

/**
 * Snake-style player: body is a list of discrete cell segments rather than
 * one static rectangle. `layout`/`width`/`height`/`x`/`y` get rebuilt from
 * `segments` on every update so the rest of the engine (collision, render)
 * keeps working against a normal boolean[][] layout.
 *
 * NOTE: direction handling here is intentionally bare-bones — no queued
 * turns, no "can't reverse into your own neck" guard yet. Left as a TODO
 * since that's real snake-game logic, not sprite plumbing.
 */
export class DynamicPlayer extends Player {
    public readonly category: SpriteCategory = "PLAYER";
    public segments: { x: number; y: number }[];

    constructor(
        id: string,
        cellShape: boolean[][],
        x: number = 0,
        y: number = 0,
        vx: number = 1,
        vy: number = 1,
        input: InputManager
    ) {
        super(id, cellShape, x, y, vx, vy, input);
        this.segments = [{ x, y }];
        this.rebuildLayout();
    }

    public grow(): void {
        const tail = this.segments[this.segments.length - 1];
        this.segments.push({ ...tail });
    }

    public update(): void {
        if (!this.isAlive) return;
        const { dx, dy } = this.getDirection();
        if (dx === 0 && dy === 0) return;

        const head = this.segments[0];
        const newHead = {
            x: Math.max(0, Math.min(ENGINE_CONFIG.COLS - 1, head.x + dx)),
            y: Math.max(0, Math.min(ENGINE_CONFIG.ROWS - 1, head.y + dy)),
        };

        this.segments = [newHead, ...this.segments.slice(0, -1)];
        this.rebuildLayout();
    }

    private rebuildLayout(): void {
        const xs = this.segments.map((s) => s.x);
        const ys = this.segments.map((s) => s.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const w = Math.max(...xs) - minX + 1;
        const h = Math.max(...ys) - minY + 1;

        const grid = Array.from({ length: h }, () => Array(w).fill(false));
        for (const seg of this.segments) {
            grid[seg.y - minY][seg.x - minX] = true;
        }

        this.layout = grid;
        this.x = minX;
        this.y = minY;
        this.width = w;
        this.height = h;
        this.maxX = ENGINE_CONFIG.COLS - this.width;
        this.maxY = ENGINE_CONFIG.ROWS - this.height;
    }
}


export abstract class Enemy extends Sprite { }

export class BouncingEnemy extends Enemy {
    public readonly category: SpriteCategory = "ENEMY";

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

export class PatrolEnemy extends Enemy {
    public readonly category: SpriteCategory = "ENEMY";
    public axis: "horizontal" | "vertical";

    constructor(
        id: string,
        layout: boolean[][],
        x: number = 0,
        y: number = 0,
        vx: number = 1,
        vy: number = 1,
        axis: "horizontal" | "vertical" = "horizontal"
    ) {
        super(id, layout, x, y, vx, vy);
        this.axis = axis;
    }

    public update(): void {
        if (this.axis === "horizontal") {
            if (this.x >= this.maxX || this.x <= 0) this.vx *= -1;
            this.x = Math.max(0, Math.min(this.maxX, this.x + this.vx));
        } else {
            if (this.y >= this.maxY || this.y <= 0) this.vy *= -1;
            this.y = Math.max(0, Math.min(this.maxY, this.y + this.vy));
        }
    }
}

export class Prop extends Sprite {
    public readonly category: SpriteCategory = "PROP";

    constructor(id: string, layout: boolean[][], x: number = 0, y: number = 0) {
        super(id, layout, x, y, 0, 0);
    }

    public update(): void {

    }
}

export abstract class Pill extends Sprite {
    public points: number;

    constructor(
        id: string,
        layout: boolean[][],
        x: number = 0,
        y: number = 0,
        points: number = 1
    ) {
        super(id, layout, x, y, 0, 0);
        this.points = points;
    }

    public update(): void {

    }

    public abstract onCollected(findFreeSpot: () => { x: number; y: number }): boolean;
}


export class RespawningPill extends Pill {
    public readonly category: SpriteCategory = "PILL";

    public onCollected(findFreeSpot: () => { x: number; y: number }): boolean {
        const spot = findFreeSpot();
        this.setPosition(spot.x, spot.y);
        return false;
    }
}

export class CountedPill extends Pill {
    public readonly category: SpriteCategory = "PILL";

    public onCollected(): boolean {
        return true;
    }
}
export type FirePositionProvider = () => { x: number; y: number };

export class Bullet extends Sprite {
    public readonly category: SpriteCategory = "BULLET";

    public ownerId: string;

    constructor(
        id: string,
        layout: boolean[][],
        x: number = 0,
        y: number = 0,
        vx: number = 1,
        vy: number = 1,
        ownerId: string
    ) {
        super(id, layout, x, y, vx, vy);
        this.ownerId = ownerId;
    }

    public update(): void {
        this.x += this.vx;
        this.y += this.vy;
    }

    public isOffscreen(): boolean {
        return (
            this.x + this.width < 0 ||
            this.x > ENGINE_CONFIG.COLS ||
            this.y + this.height < 0 ||
            this.y > ENGINE_CONFIG.ROWS
        );
    }
}


export class Weapon {
    private getFirePosition: FirePositionProvider;
    private bulletShape: boolean[][];
    private vx: number;
    private vy: number;
    private nextBulletIndex = 0;

    constructor(
        getFirePosition: FirePositionProvider,
        bulletShape: boolean[][],
        vx: number = 0,
        vy: number = -1
    ) {
        this.getFirePosition = getFirePosition;
        this.bulletShape = bulletShape;
        this.vx = vx;
        this.vy = vy;
    }

    public fire(ownerId: string): Bullet {
        const { x, y } = this.getFirePosition();
        const bulletId = `${ownerId}_bullet_${this.nextBulletIndex++}`;
        return new Bullet(bulletId, this.bulletShape, x, y, this.vx, this.vy, ownerId);
    }
}