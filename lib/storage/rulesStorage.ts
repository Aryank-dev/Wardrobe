import type { CustomColorRule, CustomStyleRule } from '../../types/rules';
import { read, write } from './storage';
import { COLORS, CATEGORIES, type Color, type Category } from '../../types/clothing';

const COLOR_RULES_KEY = 'color-rules';
const STYLE_RULES_KEY = 'style-rules';

export function getColorRules(): CustomColorRule[] {
  return read<CustomColorRule[]>(COLOR_RULES_KEY, []);
}

export function saveColorRules(rules: CustomColorRule[]): void {
  write(COLOR_RULES_KEY, rules);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wardrobe:changed'));
  }
}

export function validateColorCombination(colors: Color[]): { valid: boolean; error?: string } {
  if (!colors || colors.length < 2) {
    return { valid: false, error: 'Select at least 2 colors for a combination.' };
  }
  for (const c of colors) {
    if (!COLORS.includes(c)) {
      return { valid: false, error: `"${c}" is not a recognized color.` };
    }
  }
  return { valid: true };
}

export function addColorRule(
  params: { name?: string; colors: Color[]; enabled?: boolean }
): { success: boolean; rule?: CustomColorRule; error?: string } {
  const validation = validateColorCombination(params.colors);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const existing = getColorRules();
  const sortedTarget = [...params.colors].sort().join('|');

  // Check for duplicate combination (same set of colors)
  const isDuplicate = existing.some(
    (r) => [...r.colors].sort().join('|') === sortedTarget
  );
  if (isDuplicate) {
    return {
      success: false,
      error: 'This color combination already exists in your custom rules.',
    };
  }

  const newRule: CustomColorRule = {
    id: crypto.randomUUID(),
    name: params.name?.trim() || undefined,
    colors: params.colors,
    enabled: params.enabled !== false,
    createdAt: new Date().toISOString(),
  };

  saveColorRules([...existing, newRule]);
  return { success: true, rule: newRule };
}

export function toggleColorRule(id: string): void {
  const updated = getColorRules().map((r) =>
    r.id === id ? { ...r, enabled: !r.enabled } : r
  );
  saveColorRules(updated);
}

export function deleteColorRule(id: string): void {
  const updated = getColorRules().filter((r) => r.id !== id);
  saveColorRules(updated);
}

export function getStyleRules(): CustomStyleRule[] {
  return read<CustomStyleRule[]>(STYLE_RULES_KEY, []);
}

export function saveStyleRules(rules: CustomStyleRule[]): void {
  write(STYLE_RULES_KEY, rules);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wardrobe:changed'));
  }
}

export function validateStyleCombination(categories: Category[]): { valid: boolean; error?: string } {
  if (!categories || categories.length < 2) {
    return { valid: false, error: 'Select at least 2 garment categories for a style rule.' };
  }
  for (const c of categories) {
    if (!CATEGORIES.includes(c)) {
      return { valid: false, error: `"${c}" is not a recognized category.` };
    }
  }
  return { valid: true };
}

export function addStyleRule(
  params: { name?: string; categories: Category[]; enabled?: boolean }
): { success: boolean; rule?: CustomStyleRule; error?: string } {
  const validation = validateStyleCombination(params.categories);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const existing = getStyleRules();
  const sortedTarget = [...params.categories].sort().join('|');

  // Check for duplicate combination (same set of categories)
  const isDuplicate = existing.some(
    (r) => [...r.categories].sort().join('|') === sortedTarget
  );
  if (isDuplicate) {
    return {
      success: false,
      error: 'This style combination already exists in your custom rules.',
    };
  }

  const newRule: CustomStyleRule = {
    id: crypto.randomUUID(),
    name: params.name?.trim() || undefined,
    categories: params.categories,
    enabled: params.enabled !== false,
    createdAt: new Date().toISOString(),
  };

  saveStyleRules([...existing, newRule]);
  return { success: true, rule: newRule };
}

export function toggleStyleRule(id: string): void {
  const updated = getStyleRules().map((r) =>
    r.id === id ? { ...r, enabled: !r.enabled } : r
  );
  saveStyleRules(updated);
}

export function deleteStyleRule(id: string): void {
  const updated = getStyleRules().filter((r) => r.id !== id);
  saveStyleRules(updated);
}
