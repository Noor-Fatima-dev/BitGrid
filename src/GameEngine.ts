// src/GameEngine.ts — only the changed/added parts shown in context
import { DotMatrixEngine } from "./DotMatrixEngine";
import {
  Sprite,
  SpriteCategory,
  Player,
  StaticPlayer,
  DynamicPlayer,
  Enemy,
  BouncingEnemy,
  PatrolEnemy,
  Prop,
  Pill,
  RespawningPill,
  CountedPill,
  Bullet,
} from "./Sprite";
import { InputManager } from "./InputManager";
import { ENGINE_CONFIG } from "./engineTypes";

export type SpriteBehaviorType =
  | "STATIC_PLAYER"
  | "DYNAMIC_PLAYER"
  | "BOUNCING_ENEMY"
  | "PATROL_ENEMY"
  | "PROP"
  | "RESPAWNING_PILL"
  | "COUNTED_PILL";

type CollisionHandler = (a: Sprite, b: Sprite) => void;

export default class GameEngine {
  public matrix: DotMatrixEngine;
  public sprites: Map<string, Sprite> = new Map();
  public input: InputManager;

  public onPlayerDied: ((player: Player) => void) | null = null;
  public onPillBatchDepleted: (() => void) | null = null;

  private collisionRules: Map<string, CollisionHandler> = new Map();

  constructor(matrix: DotMatrixEngine) {
    this.matrix = matrix;
    this.input = new InputManager();
    this.registerDefaultCollisionRules();
  }

  public create(
    type: SpriteBehaviorType,
    id: string,
    layout: boolean[][],
    x: number = 0,
    y: number = 0,
    vx: number = 1,
    vy: number = 1,
    extra: { axis?: "horizontal" | "vertical"; points?: number } = {}
  ): void {
    switch (type) {
      case "STATIC_PLAYER":
        this.registerSprite(new StaticPlayer(id, layout, x, y, vx, vy, this.input));
        break;
      case "DYNAMIC_PLAYER":
        this.registerSprite(new DynamicPlayer(id, layout, x, y, vx, vy, this.input));
        break;
      case "BOUNCING_ENEMY":
        this.registerSprite(new BouncingEnemy(id, layout, x, y, vx, vy));
        break;
      case "PATROL_ENEMY":
        this.registerSprite(
          new PatrolEnemy(id, layout, x, y, vx, vy, extra.axis ?? "horizontal")
        );
        break;
      case "PROP":
        this.registerSprite(new Prop(id, layout, x, y));
        break;
      case "RESPAWNING_PILL":
        this.registerSprite(new RespawningPill(id, layout, x, y, extra.points ?? 1));
        break;
      case "COUNTED_PILL":
        this.registerSprite(new CountedPill(id, layout, x, y, extra.points ?? 1));
        break;
      default:
        throw new Error(`Unknown Sprite Type: ${type}`);
    }
  }

  public registerSprite(sprite: Sprite): void {
    this.sprites.set(sprite.id, sprite);
  }

  public getSprite(id: string): Sprite | undefined {
    return this.sprites.get(id);
  }

  public getAllSprites(): Sprite[] {
    return Array.from(this.sprites.values());
  }

  public getAllPlayers(): Player[] {
    return this.getAllSprites().filter((s): s is Player => s instanceof Player);
  }

  public hasSprite(id: string): boolean {
    return this.sprites.has(id);
  }

  public updateSprite(
    id: string,
    type: SpriteBehaviorType,
    layout: boolean[][],
    x: number = 0,
    y: number = 0,
    vx: number = 1,
    vy: number = 1,
    extra: { axis?: "horizontal" | "vertical"; points?: number } = {}
  ): void {
    if (!this.sprites.has(id)) {
      throw new Error(`Cannot update - sprite not found: ${id}`);
    }
    this.create(type, id, layout, x, y, vx, vy, extra);
  }

  public deleteSprite(id: string): boolean {
    return this.sprites.delete(id);
  }

  /** Resets score/health/alive state for every player, without touching sprites or the board. Call this before starting a fresh run. */
  public resetPlayers(): void {
    for (const player of this.getAllPlayers()) {
      player.score = 0;
      player.health = 100;
      player.isAlive = true;
    }
  }

  public fireWeapon(playerId: string): void {
    const player = this.getSprite(playerId);
    if (player instanceof Player && player.isAlive && player.weapon) {
      const bullet = player.weapon.fire(player.id);
      this.registerSprite(bullet);
    }
  }

  public render(): void {
    this.matrix.clear();

    // Edge-triggered fire: one bullet per physical Spacebar press, from
    // every alive player that currently has a weapon equipped.
    if (this.input.wasJustPressed(" ")) {
      for (const player of this.getAllPlayers()) {
        if (player.isAlive && player.weapon) {
          this.fireWeapon(player.id);
        }
      }
    }

    for (const sprite of this.getAllSprites()) {
      if (sprite instanceof Player && !sprite.isAlive) continue;
      sprite.update();
    }

    this.cleanupOffscreenBullets();
    this.checkCollisions();

    for (const sprite of this.getAllSprites()) {
      this.drawSprite(sprite);
    }
  }

  private drawSprite(sprite: Sprite): void {
    for (let r = 0; r < sprite.height; r++) {
      for (let c = 0; c < sprite.width; c++) {
        if (sprite.layout[r][c]) {
          this.matrix.setPixel(sprite.x + c, sprite.y + r, true);
        }
      }
    }
  }

  private cleanupOffscreenBullets(): void {
    for (const sprite of this.getAllSprites()) {
      if (sprite instanceof Bullet && sprite.isOffscreen()) {
        this.deleteSprite(sprite.id);
      }
    }
  }

  public registerCollisionRule(
    categoryA: SpriteCategory,
    categoryB: SpriteCategory,
    handler: CollisionHandler
  ): void {
    this.collisionRules.set(this.ruleKey(categoryA, categoryB), handler);
  }

  private ruleKey(a: SpriteCategory, b: SpriteCategory): string {
    return [a, b].sort().join(":");
  }

  private registerDefaultCollisionRules(): void {
    this.registerCollisionRule("PLAYER", "PILL", (a, b) => {
      const [player, pill] =
        a instanceof Player ? [a, b as Pill] : [b as Player, a as Pill];
      this.handlePlayerPill(player, pill);
    });

    this.registerCollisionRule("PLAYER", "ENEMY", (a, b) => {
      const [player, enemy] =
        a instanceof Player ? [a, b as Enemy] : [b as Player, a as Enemy];
      this.handlePlayerEnemy(player, enemy);
    });

    this.registerCollisionRule("BULLET", "ENEMY", (a, b) => {
      const [bullet, enemy] =
        a instanceof Bullet ? [a, b as Enemy] : [b as Bullet, a as Enemy];
      this.handleBulletEnemy(bullet, enemy);
    });
  }

  private checkCollisions(): void {
    const spriteList = this.getAllSprites();

    for (let i = 0; i < spriteList.length; i++) {
      for (let j = i + 1; j < spriteList.length; j++) {
        const a = spriteList[i];
        const b = spriteList[j];

        if (!this.sprites.has(a.id) || !this.sprites.has(b.id)) continue;
        if (!a.collidesWith(b)) continue;

        const handler = this.collisionRules.get(this.ruleKey(a.category, b.category));
        handler?.(a, b);
      }
    }
  }

  private handlePlayerPill(player: Player, pill: Pill): void {
    const shouldRemove = pill.onCollected(() => this.findFreeSpot(pill));

    player.addScore(pill.points);
    if (player instanceof DynamicPlayer) {
      player.grow();
    }

    if (shouldRemove) {
      this.deleteSprite(pill.id);
      if (pill instanceof CountedPill) {
        this.checkPillBatchDepleted();
      }
    }
  }

  private handlePlayerEnemy(player: Player, enemy: Enemy): void {
    const died = player.takeDamage(10);
    if (died) {
      this.onPlayerDied?.(player);
    }
  }

  private handleBulletEnemy(bullet: Bullet, enemy: Enemy): void {
    this.deleteSprite(bullet.id);
    this.deleteSprite(enemy.id);

    const owner = this.getSprite(bullet.ownerId);
    if (owner instanceof Player) {
      owner.addScore(10);
    }
  }

  private checkPillBatchDepleted(): void {
    const remaining = this.getAllSprites().filter((s) => s instanceof CountedPill);
    if (remaining.length === 0) {
      this.onPillBatchDepleted?.();
    }
  }

  private findFreeSpot(subject: Sprite): { x: number; y: number } {
    const maxAttempts = 100;

    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Math.random() * (ENGINE_CONFIG.COLS - subject.width + 1));
      const y = Math.floor(Math.random() * (ENGINE_CONFIG.ROWS - subject.height + 1));

      const occupied = this.getAllSprites().some((other) => {
        if (other.id === subject.id) return false;
        return (
          x < other.x + other.width &&
          x + subject.width > other.x &&
          y < other.y + other.height &&
          y + subject.height > other.y
        );
      });

      if (!occupied) return { x, y };
    }

    return {
      x: Math.floor(Math.random() * (ENGINE_CONFIG.COLS - subject.width + 1)),
      y: Math.floor(Math.random() * (ENGINE_CONFIG.ROWS - subject.height + 1)),
    };
  }

  public destroy(): void {
    this.input.destroy();
  }
}