export interface Palette {
  /** The colour itself */
  color: string;
  /** Black or white, whichever is easier to read on the colour */
  contrast: string;
  /** Opposite on the colour wheel (180°) */
  complementary: string;
  /** Either side of the complement (150° and 210°) */
  splitComplementary: [string, string];
  /** Next door on the colour wheel (-30° and +30°) */
  analogous: [string, string];
  /** A third of the way round each way (120° and 240°) */
  triadic: [string, string];
  /** A square: 90°, 180° and 270° */
  tetradic: [string, string, string];
}

export function getDailyColor(date?: Date): string;
export function getDailyPalette(date?: Date): Palette;
export function getPalette(hex: string): Palette;
export function contrastColor(hex: string): string;
