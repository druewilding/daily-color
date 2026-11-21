export interface Palette {
  /** The color itself */
  color: string;
  /** Black or white, whichever is easier to read on the color */
  contrast: string;
  /** Opposite on the color wheel (180°) */
  complementary: string;
  /** Either side of the complement (150° and 210°) */
  splitComplementary: [string, string];
  /** Next door on the color wheel (-30° and +30°) */
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

/** The WCAG contrast ratio between two colors, from 1 to 21 */
export function contrastRatio(a: string, b: string): number;

export interface Oklch {
  /** Lightness, 0 to 1 */
  l: number;
  /** Chroma (strength), 0 to about 0.37 */
  c: number;
  /** Hue, 0 to 360° */
  h: number;
}

/** A hex color in OKLCH */
export function toOklch(hex: string): Oklch;
/** The hex code for an OKLCH color, with chroma brought down to fit in sRGB */
export function oklch(l: number, c: number, h: number): string;
/**
 * The color made darker or lighter until it reads on the background (4.5:1 by
 * default), keeping its hue and chroma. Black or white if nothing is enough.
 */
export function readableOn(color: string | Oklch, background: string, ratio?: number): string;
