import type { ClothingItem, Occasion, Season, Temperature } from '../types/clothing';
import type { Outfit } from '../types/outfit';
import type { CustomColorRule, CustomStyleRule } from '../types/rules';
import { groupForCategory } from '../types/clothing';
import { isObviouslyBad } from './compatibility';
import { scoreOutfit } from './outfitScoring';

export function generateOutfits(
  items: ClothingItem[],
  existing: Outfit[] = [],
  context?: {
    occasion?: Occasion;
    temperature?: Temperature;
    season?: Season;
    colorRules?: CustomColorRule[];
    styleRules?: CustomStyleRule[];
  }
): Outfit[] {
  const active = items.filter((i) => i.isActive);
  const tops = active.filter((i) => groupForCategory(i.category) === 'top');
  const bottoms = active.filter((i) => groupForCategory(i.category) === 'bottom');
  const shoes = active.filter((i) => groupForCategory(i.category) === 'shoes');
  const jackets = active.filter((i) => groupForCategory(i.category) === 'outerwear');

  const result: Outfit[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        const jacketOptions: [string | undefined, ClothingItem | undefined][] = jackets.length
          ? [[undefined, undefined], ...jackets.map((j) => [j.id, j] as [string, ClothingItem])]
          : [[undefined, undefined]];

        for (const [outerId, jacket] of jacketOptions) {
          const parts = [top, bottom, shoe, ...(jacket ? [jacket] : [])];
          if (isObviouslyBad(parts)) continue;

          const id = [top.id, bottom.id, shoe.id, outerId ?? 'none'].join('_');
          const prior = existing.find((o) => o.id === id);
          const score = scoreOutfit(parts, context, prior ?? undefined);
          if (score.total < 60) continue;

          result.push({
            id,
            topId: top.id,
            bottomId: bottom.id,
            shoesId: shoe.id,
            outerwearId: outerId,
            score,
            occasions: [...new Set(parts.flatMap((i) => i.occasions))],
            styles: [...new Set(parts.flatMap((i) => i.styles))],
            createdAt: prior?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timesWorn: prior?.timesWorn ?? 0,
            lastWornAt: prior?.lastWornAt ?? null,
          });
        }
      }
    }
  }

  const sorted = result.sort((a, b) => b.score.total - a.score.total);
  const kept: Outfit[] = [];

  for (const o of sorted) {
    const near = kept.some((k) => {
      const sameBase = k.topId === o.topId && k.bottomId === o.bottomId && k.shoesId === o.shoesId;
      const jacketVariant = sameBase && k.outerwearId !== o.outerwearId;
      return (sameBase && !jacketVariant) || (jacketVariant && Math.abs(k.score.total - o.score.total) < 3);
    });
    if (!near) kept.push(o);
  }

  return kept;
}

export type RegenerateResult =
  | {
      success: true;
      outfit: Outfit;
      totalPossible: number;
    }
  | {
      success: false;
      reason: 'insufficient_items';
      missingCategories: ('top' | 'bottom' | 'shoes')[];
      message: string;
    };

/**
 * Generates a fresh, high-scoring combination avoiding immediate repeats.
 * Uses the compatibility engine + custom rule bonuses, and respects categories.
 */
export function generateSingleCombination({
  items,
  currentOutfitId,
  context,
  existing = [],
  excludedOutfitIds = [],
}: {
  items: ClothingItem[];
  currentOutfitId?: string;
  context?: {
    occasion?: Occasion;
    temperature?: Temperature;
    season?: Season;
    colorRules?: CustomColorRule[];
    styleRules?: CustomStyleRule[];
  };
  existing?: Outfit[];
  excludedOutfitIds?: string[];
}): RegenerateResult {
  const active = items.filter((i) => i.isActive);
  const tops = active.filter((i) => groupForCategory(i.category) === 'top');
  const bottoms = active.filter((i) => groupForCategory(i.category) === 'bottom');
  const shoes = active.filter((i) => groupForCategory(i.category) === 'shoes');
  const jackets = active.filter((i) => groupForCategory(i.category) === 'outerwear');

  const missing: ('top' | 'bottom' | 'shoes')[] = [];
  if (tops.length === 0) missing.push('top');
  if (bottoms.length === 0) missing.push('bottom');
  if (shoes.length === 0) missing.push('shoes');

  if (missing.length > 0) {
    const missingNames = missing.map((m) => (m === 'shoes' ? 'a pair of shoes' : `a ${m}`)).join(', ');
    return {
      success: false,
      reason: 'insufficient_items',
      missingCategories: missing,
      message: `Your wardrobe needs at least ${missingNames} to generate outfits.`,
    };
  }

  // Generate and score all valid combinations
  const candidates: Outfit[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        const jacketOptions: [string | undefined, ClothingItem | undefined][] = jackets.length
          ? [[undefined, undefined], ...jackets.map((j) => [j.id, j] as [string, ClothingItem])]
          : [[undefined, undefined]];

        for (const [outerId, jacket] of jacketOptions) {
          const parts = [top, bottom, shoe, ...(jacket ? [jacket] : [])];
          if (isObviouslyBad(parts)) continue;

          // If filtering by occasion context
          if (context?.occasion && !parts.some((p) => p.occasions.includes(context.occasion!))) {
            continue;
          }

          const id = [top.id, bottom.id, shoe.id, outerId ?? 'none'].join('_');
          const prior = existing.find((o) => o.id === id);
          const score = scoreOutfit(parts, context, prior ?? undefined);

          // If filtering by temperature or season
          if (context?.temperature && context.temperature !== 'all' && score.temperature < 60) {
            continue;
          }
          if (context?.season && context.season !== 'all' && score.season < 60) {
            continue;
          }

          if (score.total < 60) continue;

          candidates.push({
            id,
            topId: top.id,
            bottomId: bottom.id,
            shoesId: shoe.id,
            outerwearId: outerId,
            score,
            occasions: [...new Set(parts.flatMap((i) => i.occasions))],
            styles: [...new Set(parts.flatMap((i) => i.styles))],
            createdAt: prior?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timesWorn: prior?.timesWorn ?? 0,
            lastWornAt: prior?.lastWornAt ?? null,
          });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      reason: 'insufficient_items',
      missingCategories: [],
      message: 'No compatible outfits could be generated with the current wardrobe pieces and filters.',
    };
  }

  // Sort by score descending (preferring higher compatibility and custom rule bonuses)
  candidates.sort((a, b) => b.score.total - a.score.total);

  // Avoid immediately repeating currentOutfitId and recently excluded IDs
  const avoidIds = new Set<string>();
  if (currentOutfitId) avoidIds.add(currentOutfitId);
  for (const id of excludedOutfitIds) avoidIds.add(id);

  const freshCandidates = candidates.filter((c) => !avoidIds.has(c.id));

  // If there are fresh candidates, pick among the top-tier candidates
  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  // Pick the top scoring candidate (or cycle among top candidates)
  const chosen = pool[0];

  return {
    success: true,
    outfit: chosen,
    totalPossible: candidates.length,
  };
}
