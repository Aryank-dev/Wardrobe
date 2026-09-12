import type { ClothingItem, Color } from '../types/clothing';
import { groupForCategory } from '../types/clothing';

interface ColorMeta {
  family: 'neutral' | 'blue' | 'green' | 'red_pink' | 'yellow_orange' | 'purple' | 'other';
  lightness: number; // 0 (dark) to 1 (light)
  saturation: 'neutral' | 'pastel' | 'muted' | 'vibrant';
  isNeutral: boolean;
  isEarthTone: boolean;
  isPastel: boolean;
  isStrong: boolean;
  isDenim: boolean;
  hue: number; // degrees approx
}

const COLOR_METAS: Record<Color, ColorMeta> = {
  // Neutrals
  white: { family: 'neutral', lightness: 1.0, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  off_white: { family: 'neutral', lightness: 0.95, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 45 },
  cream: { family: 'neutral', lightness: 0.92, saturation: 'pastel', isNeutral: true, isEarthTone: true, isPastel: true, isStrong: false, isDenim: false, hue: 50 },
  ivory: { family: 'neutral', lightness: 0.94, saturation: 'pastel', isNeutral: true, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 55 },
  black: { family: 'neutral', lightness: 0.05, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  charcoal: { family: 'neutral', lightness: 0.25, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  light_grey: { family: 'neutral', lightness: 0.75, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  grey: { family: 'neutral', lightness: 0.5, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  dark_grey: { family: 'neutral', lightness: 0.35, saturation: 'neutral', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  beige: { family: 'neutral', lightness: 0.82, saturation: 'muted', isNeutral: true, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 40 },
  khaki: { family: 'neutral', lightness: 0.65, saturation: 'muted', isNeutral: true, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 45 },
  taupe: { family: 'neutral', lightness: 0.55, saturation: 'muted', isNeutral: true, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 35 },
  brown: { family: 'neutral', lightness: 0.4, saturation: 'muted', isNeutral: true, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 30 },
  dark_brown: { family: 'neutral', lightness: 0.22, saturation: 'muted', isNeutral: true, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 25 },
  navy: { family: 'neutral', lightness: 0.2, saturation: 'muted', isNeutral: true, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 230 },

  // Blues
  sky_blue: { family: 'blue', lightness: 0.78, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 195 },
  light_blue: { family: 'blue', lightness: 0.8, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 210 },
  blue: { family: 'blue', lightness: 0.5, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 215 },
  royal_blue: { family: 'blue', lightness: 0.45, saturation: 'vibrant', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: true, isDenim: false, hue: 225 },
  dark_blue: { family: 'blue', lightness: 0.22, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 230 },
  denim_blue: { family: 'blue', lightness: 0.52, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: true, hue: 210 },
  teal: { family: 'blue', lightness: 0.4, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 180 },

  // Greens
  mint: { family: 'green', lightness: 0.85, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 150 },
  pastel_green: { family: 'green', lightness: 0.8, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 125 },
  green: { family: 'green', lightness: 0.45, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 120 },
  olive_green: { family: 'green', lightness: 0.42, saturation: 'muted', isNeutral: false, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 85 },
  forest_green: { family: 'green', lightness: 0.3, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 130 },
  dark_green: { family: 'green', lightness: 0.2, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 120 },

  // Reds/Pinks
  pink: { family: 'red_pink', lightness: 0.65, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 330 },
  light_pink: { family: 'red_pink', lightness: 0.85, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 340 },
  coral: { family: 'red_pink', lightness: 0.65, saturation: 'vibrant', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: true, isDenim: false, hue: 15 },
  red: { family: 'red_pink', lightness: 0.45, saturation: 'vibrant', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: true, isDenim: false, hue: 0 },
  maroon: { family: 'red_pink', lightness: 0.25, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 350 },
  burgundy: { family: 'red_pink', lightness: 0.22, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 345 },

  // Yellow/Orange
  pastel_yellow: { family: 'yellow_orange', lightness: 0.9, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 60 },
  yellow: { family: 'yellow_orange', lightness: 0.6, saturation: 'vibrant', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: true, isDenim: false, hue: 55 },
  mustard: { family: 'yellow_orange', lightness: 0.55, saturation: 'muted', isNeutral: false, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 48 },
  orange: { family: 'yellow_orange', lightness: 0.55, saturation: 'vibrant', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: true, isDenim: false, hue: 30 },
  rust: { family: 'yellow_orange', lightness: 0.4, saturation: 'muted', isNeutral: false, isEarthTone: true, isPastel: false, isStrong: false, isDenim: false, hue: 20 },

  // Purple
  lavender: { family: 'purple', lightness: 0.85, saturation: 'pastel', isNeutral: false, isEarthTone: false, isPastel: true, isStrong: false, isDenim: false, hue: 270 },
  purple: { family: 'purple', lightness: 0.45, saturation: 'vibrant', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: true, isDenim: false, hue: 280 },
  dark_purple: { family: 'purple', lightness: 0.2, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 285 },

  // Other
  multicolor: { family: 'other', lightness: 0.5, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
  other: { family: 'other', lightness: 0.5, saturation: 'muted', isNeutral: false, isEarthTone: false, isPastel: false, isStrong: false, isDenim: false, hue: 0 },
};

function pairKey(a: Color, b: Color): string {
  return [a, b].sort().join('|');
}

/**
 * 25 Benchmark Heuristic Rankings
 * Stored on a 0-100 scale (10.0 = 100, 9.9 = 99, etc.)
 * Expanding variants (e.g. Beige/Khaki, Maroon/Burgundy, Orange/Rust, Grey variants)
 */
const BENCHMARK_PAIRS: Record<string, number> = {};

function addBenchmark(colorsA: Color[], colorsB: Color[], score: number) {
  for (const a of colorsA) {
    for (const b of colorsB) {
      BENCHMARK_PAIRS[pairKey(a, b)] = score;
    }
  }
}

// 1. White + Black = 10.0 (100)
addBenchmark(['white', 'off_white'], ['black'], 100);
// 2. Black + Blue Denim = 9.9 (99)
addBenchmark(['black'], ['denim_blue'], 99);
// 3. White + Blue Denim = 9.8 (98)
addBenchmark(['white', 'off_white'], ['denim_blue'], 98);
// 4. Navy Blue + Beige/Khaki = 9.7 (97)
addBenchmark(['navy'], ['beige', 'khaki'], 97);
// 5. Light Blue + Dark Blue = 9.6 (96)
addBenchmark(['light_blue'], ['dark_blue'], 96);
// 6. Black + Beige/Khaki = 9.5 (95)
addBenchmark(['black'], ['beige', 'khaki'], 95);
// 7. Navy Blue + White = 9.5 (95)
addBenchmark(['navy'], ['white', 'off_white'], 95);
// 8. Grey + Black = 9.4 (94)
addBenchmark(['grey', 'charcoal', 'light_grey', 'dark_grey'], ['black'], 94);
// 9. Olive Green + Beige/Khaki = 9.3 (93)
addBenchmark(['olive_green'], ['beige', 'khaki'], 93);
// 10. White + Olive Green = 9.2 (92)
addBenchmark(['white', 'off_white'], ['olive_green'], 92);
// 11. Cream + Dark Brown = 9.2 (92)
addBenchmark(['cream'], ['dark_brown'], 92);
// 12. Maroon/Burgundy + Black = 9.1 (91)
addBenchmark(['maroon', 'burgundy'], ['black'], 91);
// 13. Light Pink + Dark Blue = 9.0 (90)
addBenchmark(['light_pink'], ['dark_blue'], 90);
// 14. Grey + Blue Denim = 8.9 (89)
addBenchmark(['grey', 'light_grey', 'dark_grey'], ['denim_blue'], 89);
// 15. Beige/Cream + Blue Denim = 8.9 (89)
addBenchmark(['beige', 'cream'], ['denim_blue'], 89);
// 16. Dark Green + Black = 8.8 (88)
addBenchmark(['dark_green', 'forest_green'], ['black'], 88);
// 17. Sky Blue + White = 8.8 (88)
addBenchmark(['sky_blue'], ['white', 'off_white'], 88);
// 18. Brown + Beige/Khaki = 8.7 (87)
addBenchmark(['brown'], ['beige', 'khaki'], 87);
// 19. Lavender + Dark Blue = 8.6 (86)
addBenchmark(['lavender'], ['dark_blue'], 86);
// 20. Mustard + Dark Blue = 8.5 (85)
addBenchmark(['mustard'], ['dark_blue', 'navy'], 85);
// 21. Red + Black = 8.5 (85)
addBenchmark(['red'], ['black'], 85);
// 22. Orange/Rust + Beige/Khaki = 8.4 (84)
addBenchmark(['orange', 'rust'], ['beige', 'khaki'], 84);
// 23. Teal + Black = 8.3 (83)
addBenchmark(['teal'], ['black'], 83);
// 24. Dark Purple + Black = 8.2 (82)
addBenchmark(['dark_purple'], ['black'], 82);
// 25. Pastel Green + White = 8.1 (81)
addBenchmark(['pastel_green'], ['white', 'off_white'], 81);

/**
 * Calculates algorithmic compatibility between any two colors based on color theory heuristics.
 */
export function calculatePairScore(a: Color, b: Color): number {
  if (a === b) {
    const meta = COLOR_METAS[a];
    if (meta.isNeutral || meta.isDenim) return 80;
    if (meta.isPastel) return 72;
    if (meta.isStrong) return 55; // All bright monochrome warning
    return 65;
  }

  const key = pairKey(a, b);
  if (BENCHMARK_PAIRS[key] !== undefined) {
    return BENCHMARK_PAIRS[key];
  }

  const mA = COLOR_METAS[a];
  const mB = COLOR_METAS[b];

  // Handle other / multicolor
  if (mA.family === 'other' || mB.family === 'other') {
    if (a === 'multicolor' || b === 'multicolor') {
      return (mA.isNeutral || mB.isNeutral) ? 84 : 76;
    }
    return 75;
  }

  // Denim Blue as versatile honorary neutral
  if (mA.isDenim || mB.isDenim) {
    const other = mA.isDenim ? mB : mA;
    if (other.isNeutral) return 90;
    if (other.isPastel) return 88;
    if (other.isEarthTone) return 87;
    if (other.isStrong) return 82;
    return 85;
  }

  // Both are Neutrals
  if (mA.isNeutral && mB.isNeutral) {
    const lightDiff = Math.abs(mA.lightness - mB.lightness);
    let base = 85;
    if (lightDiff >= 0.4) base += 8; // High contrast like dark brown + cream, black + ivory
    else if (lightDiff >= 0.2) base += 4;
    return Math.min(96, base);
  }

  // Neutral + Non-Neutral
  if (mA.isNeutral || mB.isNeutral) {
    const neutral = mA.isNeutral ? mA : mB;
    const color = mA.isNeutral ? mB : mA;

    let base = 82;
    // Dark neutrals (navy, black, charcoal, dark brown) grounding light/pastel/bright colors
    if (neutral.lightness <= 0.25) {
      if (color.isPastel) base += 7;
      else if (color.isStrong) base += 5;
      else base += 6;
    }
    // Light neutrals (white, cream, ivory, light grey) brightening deep or muted tones
    else if (neutral.lightness >= 0.75) {
      if (color.lightness <= 0.4) base += 8;
      else if (color.isPastel) base += 6;
      else base += 5;
    }
    // Medium neutrals (beige, khaki, grey, taupe)
    else {
      if (color.isEarthTone) base += 8;
      else if (color.saturation === 'muted') base += 5;
      else base += 3;
    }

    return Math.min(95, base);
  }

  // Earth Tones
  if (mA.isEarthTone && mB.isEarthTone) {
    return 88;
  }

  // Monochromatic (Same color family, non-neutral)
  if (mA.family === mB.family) {
    const lightDiff = Math.abs(mA.lightness - mB.lightness);
    if (lightDiff >= 0.35) return 93; // Light Blue + Dark Blue style
    if (lightDiff >= 0.2) return 87;
    return 74;
  }

  // Analogous Colors (Adjacent hue sectors within ~60 degrees)
  const hueDiff = Math.min(Math.abs(mA.hue - mB.hue), 360 - Math.abs(mA.hue - mB.hue));
  if (hueDiff <= 55) {
    return (mA.saturation === 'vibrant' && mB.saturation === 'vibrant') ? 76 : 85;
  }

  // Complementary / Contrast (~150 to 210 degrees apart)
  if (hueDiff >= 145 && hueDiff <= 215) {
    const lightDiff = Math.abs(mA.lightness - mB.lightness);
    // Complementary works best when one is muted/dark and one is lighter
    if (lightDiff >= 0.25) return 86;
    if (mA.saturation === 'vibrant' && mB.saturation === 'vibrant') return 62; // Neon clash
    return 80;
  }

  // Pastels together
  if (mA.isPastel && mB.isPastel) {
    return 80;
  }

  // Both are strong vibrant colors (e.g. Red + Royal Blue, Orange + Bright Green)
  if (mA.isStrong && mB.isStrong) {
    return 56; // Strong clash penalty
  }

  // Default harmonic baseline for moderately saturated combos
  return 74;
}

/**
 * Calculates holistic color compatibility across TOP, BOTTOM, SHOES, and OPTIONAL OUTERWEAR.
 * Evaluates silhouette hierarchy, shoe grounding, 3-color palette harmony, and patterns.
 * Returns a score between 0 and 100.
 */
export function colorCompatibility(items: ClothingItem[]): number {
  if (!items || items.length === 0) return 0;
  if (items.length === 1) return 85;

  const top = items.find(i => groupForCategory(i.category) === 'top') ?? items[0];
  const bottom = items.find(i => groupForCategory(i.category) === 'bottom') ?? items[1 % items.length];
  const shoes = items.find(i => groupForCategory(i.category) === 'shoes') ?? items[2 % items.length];
  const outer = items.find(i => groupForCategory(i.category) === 'outerwear');

  // Pairwise scores among structural components
  const sTopBottom = calculatePairScore(top.color, bottom.color);
  const sBottomShoes = calculatePairScore(bottom.color, shoes.color);
  const sTopShoes = calculatePairScore(top.color, shoes.color);

  let baseScore: number;
  let allPairScores: number[];

  if (outer) {
    const sOuterTop = calculatePairScore(outer.color, top.color);
    const sOuterBottom = calculatePairScore(outer.color, bottom.color);
    const sOuterShoes = calculatePairScore(outer.color, shoes.color);
    allPairScores = [sTopBottom, sBottomShoes, sTopShoes, sOuterTop, sOuterBottom, sOuterShoes];

    baseScore =
      sTopBottom * 0.28 +
      sBottomShoes * 0.22 +
      sTopShoes * 0.16 +
      sOuterBottom * 0.18 +
      sOuterTop * 0.16;
  } else {
    allPairScores = [sTopBottom, sBottomShoes, sTopShoes];
    // Silhouette anchor (Top + Bottom) is 40%, bottom + shoes 30%, top + shoes visual echo 30%
    baseScore = sTopBottom * 0.40 + sBottomShoes * 0.30 + sTopShoes * 0.30;
  }

  // 1. Weakest-link drag penalty:
  // "Avoid giving a high score to an outfit simply because one pair matches while the third item clashes."
  const minPair = Math.min(...allPairScores);
  let clashDrag = 0;
  if (minPair < 70) {
    clashDrag = (70 - minPair) * 0.6;
  }

  // 2. Shoe Grounding & Sandwiching Rules:
  // Classic fashion harmony rules:
  // - Top and shoes match (Sandwiching rule: e.g. White top + Black bottoms + White sneakers)
  // - Shoes are versatile neutrals (white sneakers, dark brown shoes with navy/beige, black shoes with darks)
  let shoeBonus = 0;
  const shoesMeta = COLOR_METAS[shoes.color];
  const topMeta = COLOR_METAS[top.color];

  const shoesEchoTop = shoes.color === top.color ||
    (shoesMeta.family === topMeta.family && Math.abs(shoesMeta.lightness - topMeta.lightness) < 0.2);

  if (shoesEchoTop && sTopBottom >= 75) {
    shoeBonus += 4; // Sandwiching bonus
  } else if (shoesMeta.isNeutral) {
    if (shoes.color === 'white' && bottom.color !== 'white') {
      shoeBonus += 3; // Clean white sneaker grounding
    } else if ((shoes.color === 'brown' || shoes.color === 'dark_brown') &&
               (bottom.color === 'navy' || bottom.color === 'beige' || bottom.color === 'khaki' || bottom.color === 'denim_blue')) {
      shoeBonus += 4; // Classic menswear/smart-casual brown shoes with navy/beige/denim
    } else if (shoes.color === 'black' && (bottom.color === 'black' || bottom.color === 'grey' || bottom.color === 'charcoal')) {
      shoeBonus += 3;
    }
  }

  // 3. Palette Count & 3-Color Harmony Rule:
  // Distinct non-neutral color families in the outfit
  const nonNeutralFamilies = new Set(
    items
      .map(i => COLOR_METAS[i.color])
      .filter(m => !m.isNeutral && !m.isDenim && m.family !== 'other')
      .map(m => m.family)
  );

  let paletteAdjustment = 0;
  if (nonNeutralFamilies.size <= 1) {
    // 0 or 1 accent color with neutrals = timeless, elegant, balanced
    paletteAdjustment += 4;
  } else if (nonNeutralFamilies.size === 2) {
    // 2 accent colors: check if analogous or complementary
    const families = [...nonNeutralFamilies];
    const itemA = items.find(i => COLOR_METAS[i.color].family === families[0])!;
    const itemB = items.find(i => COLOR_METAS[i.color].family === families[1])!;
    const pairScore = calculatePairScore(itemA.color, itemB.color);
    if (pairScore >= 82) paletteAdjustment += 2;
    else paletteAdjustment -= 4;
  } else {
    // 3 or more disparate accent color families = visual clutter
    paletteAdjustment -= 12;
  }

  // 4. Excessive Strong-Color Penalty:
  // Count vibrant, loud colors (red, royal blue, orange, yellow, coral, bright purple)
  const strongColors = items.filter(i => COLOR_METAS[i.color].isStrong);
  let strongColorPenalty = 0;
  if (strongColors.length >= 2) {
    strongColorPenalty = 14 + (strongColors.length - 2) * 8;
  }

  // 5. Patterned Clothes Handling:
  // - Primary color is dominant (already used in pairing).
  // - Secondary colors provide accent tie-ins with other pieces.
  // - Multiple busy patterns penalized.
  let patternBonus = 0;
  let patternPenalty = 0;

  const patternedItems = items.filter(i => i.pattern !== 'solid');
  if (patternedItems.length >= 2) {
    patternPenalty = patternedItems.length === 2 ? 8 : 16;
  }

  // Check if secondary colors create accent harmony with other items' primary colors
  for (const pItem of patternedItems) {
    if (pItem.secondaryColors && pItem.secondaryColors.length > 0) {
      const otherItems = items.filter(i => i.id !== pItem.id);
      // Give highest weight to first secondary color, minor to second
      pItem.secondaryColors.slice(0, 2).forEach((secColor, idx) => {
        const weight = idx === 0 ? 1 : 0.4;
        const matchesOther = otherItems.some(o => o.color === secColor || calculatePairScore(secColor, o.color) >= 88);
        if (matchesOther) {
          patternBonus += Math.round(3 * weight);
        }
      });
    }
  }

  const finalScore = Math.round(
    baseScore -
    clashDrag +
    shoeBonus +
    paletteAdjustment -
    strongColorPenalty +
    patternBonus -
    patternPenalty
  );

  return Math.max(0, Math.min(100, finalScore));
}
