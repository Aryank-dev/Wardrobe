import type { Occasion, Season, Temperature } from './clothing';

export interface OutfitScore {
  total: number;
  color: number;
  style: number;
  occasion: number;
  temperature: number;
  season: number;
  wearHistory: number;
  customBonus?: number;
}

export interface Outfit {
  id: string;
  topId: string;
  bottomId: string;
  shoesId: string;
  outerwearId?: string;
  score: OutfitScore;
  occasions: Occasion[];
  styles: string[];
  createdAt: string;
  updatedAt: string;
  timesWorn: number;
  lastWornAt: string | null;
}

export type OutfitFilter = {
  occasion: 'all' | Occasion;
  temperature: Temperature | 'all';
  season: Season | 'all';
};
