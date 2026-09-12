export const CATEGORIES = ['T-shirt','Shirt','Polo','Sweater','Jeans','Trousers','Track pants','Jacket','Sneakers','Formal shoes','Sports shoes','Crocs'] as const;
export type Category = typeof CATEGORIES[number];

export const COLOR_GROUPS = {
  NEUTRALS: [
    'white',
    'off_white',
    'cream',
    'ivory',
    'black',
    'charcoal',
    'light_grey',
    'grey',
    'dark_grey',
    'beige',
    'khaki',
    'taupe',
    'brown',
    'dark_brown',
    'navy',
  ] as const,
  BLUES: [
    'sky_blue',
    'light_blue',
    'blue',
    'royal_blue',
    'dark_blue',
    'denim_blue',
    'teal',
  ] as const,
  GREENS: [
    'mint',
    'pastel_green',
    'green',
    'olive_green',
    'forest_green',
    'dark_green',
  ] as const,
  REDS_PINKS: [
    'pink',
    'light_pink',
    'coral',
    'red',
    'maroon',
    'burgundy',
  ] as const,
  YELLOW_ORANGE: [
    'pastel_yellow',
    'yellow',
    'mustard',
    'orange',
    'rust',
  ] as const,
  PURPLE: [
    'lavender',
    'purple',
    'dark_purple',
  ] as const,
  OTHER: [
    'multicolor',
    'other',
  ] as const,
} as const;

export const COLOR_GROUP_LABELS: Record<keyof typeof COLOR_GROUPS, string> = {
  NEUTRALS: 'Neutrals',
  BLUES: 'Blues',
  GREENS: 'Greens',
  REDS_PINKS: 'Reds & Pinks',
  YELLOW_ORANGE: 'Yellows & Oranges',
  PURPLE: 'Purples',
  OTHER: 'Other',
};

export const COLORS = [
  ...COLOR_GROUPS.NEUTRALS,
  ...COLOR_GROUPS.BLUES,
  ...COLOR_GROUPS.GREENS,
  ...COLOR_GROUPS.REDS_PINKS,
  ...COLOR_GROUPS.YELLOW_ORANGE,
  ...COLOR_GROUPS.PURPLE,
  ...COLOR_GROUPS.OTHER,
] as const;

export type Color = typeof COLORS[number];

export const COLOR_LABELS: Record<Color, string> = {
  white: 'White',
  off_white: 'Off White',
  cream: 'Cream',
  ivory: 'Ivory',
  black: 'Black',
  charcoal: 'Charcoal',
  light_grey: 'Light Grey',
  grey: 'Grey',
  dark_grey: 'Dark Grey',
  beige: 'Beige',
  khaki: 'Khaki',
  taupe: 'Taupe',
  brown: 'Brown',
  dark_brown: 'Dark Brown',
  navy: 'Navy',
  sky_blue: 'Sky Blue',
  light_blue: 'Light Blue',
  blue: 'Blue',
  royal_blue: 'Royal Blue',
  dark_blue: 'Dark Blue',
  denim_blue: 'Denim Blue',
  teal: 'Teal',
  mint: 'Mint',
  pastel_green: 'Pastel Green',
  green: 'Green',
  olive_green: 'Olive Green',
  forest_green: 'Forest Green',
  dark_green: 'Dark Green',
  pink: 'Pink',
  light_pink: 'Light Pink',
  coral: 'Coral',
  red: 'Red',
  maroon: 'Maroon',
  burgundy: 'Burgundy',
  pastel_yellow: 'Pastel Yellow',
  yellow: 'Yellow',
  mustard: 'Mustard',
  orange: 'Orange',
  rust: 'Rust',
  lavender: 'Lavender',
  purple: 'Purple',
  dark_purple: 'Dark Purple',
  multicolor: 'Multicolor',
  other: 'Other',
};

export const COLOR_HEX: Record<Color, string> = {
  white: '#ffffff',
  off_white: '#faf9f6',
  cream: '#fffdd0',
  ivory: '#fffff0',
  black: '#171717',
  charcoal: '#374151',
  light_grey: '#d1d5db',
  grey: '#9ca3af',
  dark_grey: '#4b5563',
  beige: '#f5f5dc',
  khaki: '#c3b091',
  taupe: '#8b8589',
  brown: '#8b4513',
  dark_brown: '#4a2c11',
  navy: '#000080',
  sky_blue: '#87ceeb',
  light_blue: '#add8e6',
  blue: '#2563eb',
  royal_blue: '#4169e1',
  dark_blue: '#002366',
  denim_blue: '#4682b4',
  teal: '#008080',
  mint: '#98ff98',
  pastel_green: '#77dd77',
  green: '#15803d',
  olive_green: '#556b2f',
  forest_green: '#228b22',
  dark_green: '#006400',
  pink: '#ec4899',
  light_pink: '#ffb6c1',
  coral: '#ff7f50',
  red: '#dc2626',
  maroon: '#800000',
  burgundy: '#800020',
  pastel_yellow: '#fdfd96',
  yellow: '#eab308',
  mustard: '#ffdb58',
  orange: '#f97316',
  rust: '#b7410e',
  lavender: '#e6e6fa',
  purple: '#9333ea',
  dark_purple: '#4a0e4e',
  multicolor: 'linear-gradient(135deg, #f43f5e, #3b82f6, #10b981)',
  other: '#9e9e9e',
};

export const PATTERNS = ['solid','striped','checked','printed','graphic','other'] as const;
export type Pattern = typeof PATTERNS[number];
export const STYLES = ['casual','smart_casual','formal','sporty'] as const;
export type Style = typeof STYLES[number];
export const TEMPERATURES = ['hot','normal','cold','all'] as const;
export type Temperature = typeof TEMPERATURES[number];
export const SEASONS = ['summer','monsoon','winter','all'] as const;
export type Season = typeof SEASONS[number];
export const OCCASIONS = ['college','casual','party','formal','sports'] as const;
export type Occasion = typeof OCCASIONS[number];
export type ClothingGroup = 'top'|'bottom'|'outerwear'|'shoes';
export interface ClothingItem {
  id: string;
  name: string;
  image: string;
  category: Category;
  color: Color;
  secondaryColors: Color[];
  pattern: Pattern;
  styles: Style[];
  temperatures: Temperature[];
  seasons: Season[];
  occasions: Occasion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export const CATEGORY_GROUPS: Record<ClothingGroup, Category[]> = {
  top: ['T-shirt','Shirt','Polo','Sweater'],
  bottom: ['Jeans','Trousers','Track pants'],
  outerwear: ['Jacket'],
  shoes: ['Sneakers','Formal shoes','Sports shoes','Crocs'],
};
export function groupForCategory(category: Category): ClothingGroup {
  for (const [group,cats] of Object.entries(CATEGORY_GROUPS) as [ClothingGroup,Category[]][]) {
    if (cats.includes(category)) return group;
  }
  throw new Error('Unknown category');
}
