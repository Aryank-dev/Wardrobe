import type { ClothingItem, Occasion, Season, Temperature } from '../types/clothing';
import type { Outfit, OutfitScore } from '../types/outfit';
import type { CustomColorRule, CustomStyleRule } from '../types/rules';
import { colorCompatibility } from './colorScoring';
import { styleCompatibility } from './styleScoring';
import { occasionCompatibility } from './occasionScoring';
import { temperatureCompatibility } from './temperatureScoring';
import { seasonCompatibility } from './seasonScoring';
import { wearHistoryScore } from './wearHistoryScoring';
import { getColorRules, getStyleRules } from '../lib/storage/rulesStorage';

export function calculateCustomRulesBonus(
  items: ClothingItem[],
  colorRules?: CustomColorRule[],
  styleRules?: CustomStyleRule[]
): { colorBonus: number; styleBonus: number; totalBonus: number } {
  let activeColorRules: CustomColorRule[];
  let activeStyleRules: CustomStyleRule[];

  try {
    activeColorRules = (colorRules ?? getColorRules()).filter((r) => r.enabled);
    activeStyleRules = (styleRules ?? getStyleRules()).filter((r) => r.enabled);
  } catch {
    activeColorRules = (colorRules ?? []).filter((r) => r.enabled);
    activeStyleRules = (styleRules ?? []).filter((r) => r.enabled);
  }

  const outfitColors = new Set(items.flatMap((i) => [i.color, ...(i.secondaryColors || [])]));
  const outfitCategories = new Set(items.map((i) => i.category));

  let colorBonus = 0;
  for (const rule of activeColorRules) {
    const matches = rule.colors.every((c) => outfitColors.has(c));
    if (matches) {
      colorBonus += 4;
    }
  }
  colorBonus = Math.min(6, colorBonus);

  let styleBonus = 0;
  for (const rule of activeStyleRules) {
    const matches = rule.categories.every((cat) => outfitCategories.has(cat));
    if (matches) {
      styleBonus += 5;
    }
  }
  styleBonus = Math.min(8, styleBonus);

  const totalBonus = Math.min(10, colorBonus + styleBonus);
  return { colorBonus, styleBonus, totalBonus };
}

export function scoreOutfit(
  items: ClothingItem[],
  context?: {
    occasion?: Occasion;
    temperature?: Temperature;
    season?: Season;
    colorRules?: CustomColorRule[];
    styleRules?: CustomStyleRule[];
  },
  history?: Pick<Outfit, 'lastWornAt' | 'timesWorn'>
): OutfitScore {
  const c = colorCompatibility(items);
  const s = styleCompatibility(items);
  const o = occasionCompatibility(items, context?.occasion);
  const t = temperatureCompatibility(items, context?.temperature);
  const se = seasonCompatibility(items, context?.season);
  const w = wearHistoryScore(history ?? { lastWornAt: null, timesWorn: 0 });

  const baseTotal = Math.round(c * 0.30 + s * 0.25 + o * 0.20 + t * 0.10 + se * 0.05 + w * 0.10);

  // Calculate custom rules bonus
  const { totalBonus } = calculateCustomRulesBonus(items, context?.colorRules, context?.styleRules);

  // Scale bonus so obviously clashing combinations cannot be artificially inflated:
  // If baseTotal < 50, scale is 0. If baseTotal >= 65, scale is 1.0.
  const bonusScale = baseTotal >= 65 ? 1.0 : Math.max(0, (baseTotal - 50) / 15);
  const effectiveBonus = Math.round(totalBonus * bonusScale);

  const finalTotal = Math.max(0, Math.min(100, baseTotal + effectiveBonus));

  return {
    total: finalTotal,
    color: c,
    style: s,
    occasion: o,
    temperature: t,
    season: se,
    wearHistory: w,
    customBonus: effectiveBonus,
  };
}

export function qualityLabel(score: number): string {
  return score >= 90 ? 'Excellent' : score >= 80 ? 'Great' : score >= 70 ? 'Good' : 'Acceptable';
}
