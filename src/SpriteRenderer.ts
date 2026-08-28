export class SpriteRenderer {

  public static drawSprite(
    engine: any,
    sprite: string[] | boolean[][],
    x: number,
    y: number
  ): void {
    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r];
      for (let c = 0; c < row.length; c++) {
        // Handle string mask ("1" or "#") or boolean arrays
        const isPixelOn =
          typeof row === "string" ? row[c] === "1" || row[c] === "#" : row[c];

        if (isPixelOn) {
          engine.setPixel(x + c, y + r, true);
        }
      }
    }
  }
}