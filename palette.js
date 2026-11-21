// Colors that go with a color: its complement, triads and so on.
//
// The hues are turned in OKLCH, which matches how we see color better than
// HSL does, so the partners keep the color's lightness and strength. When a
// turned color doesn't fit in sRGB, its chroma comes down until it does.
//
// Grayish colors have hardly any chroma (strength) to keep, so their partners
// get at least MIN_CHROMA, and a gray day still has some color to go with it.
// A gray's hue is only a tiny tint, but it's always the same for that gray.

const MIN_CHROMA = 0.11;

/**
 * A palette of colors that go with `hex`.
 * @param {string} hex A color like "#3fa2c1"
 */
export function getPalette(hex) {
  const { L, C, H } = linToOklch(hexToLin(hex));
  const strength = Math.max(C, MIN_CHROMA);
  const turn = (degrees) => fromOklch(L, strength, (H + degrees) % 360);

  return {
    color: hex.toLowerCase(),
    contrast: contrastColor(hex),
    complementary: turn(180),
    splitComplementary: [turn(150), turn(210)],
    analogous: [turn(330), turn(30)],
    triadic: [turn(120), turn(240)],
    tetradic: [turn(90), turn(180), turn(270)],
  };
}

/** Black or white, whichever is easier to read on `hex` */
export function contrastColor(hex) {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
}

/** The WCAG contrast ratio between two colors, from 1 to 21 */
export function contrastRatio(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function luminance(hex) {
  const [r, g, b] = hexToLin(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ── sRGB <-> OKLCH ──────────────────────────────────────────────────────────

function hexToLin(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
}

function linToHex(rgb) {
  return (
    "#" +
    rgb
      .map((v) => {
        v = Math.min(1, Math.max(0, v));
        const s = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
        return Math.round(s * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

function linToOklch([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    C: Math.hypot(A, B),
    H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  };
}

function oklchToLin(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function inGamut(rgb) {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

// OKLCH -> hex, bringing chroma down until the color fits in sRGB
function fromOklch(L, C, H) {
  let rgb = oklchToLin(L, C, H);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLin(L, mid, H))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToLin(L, lo, H);
  }
  return linToHex(rgb);
}
