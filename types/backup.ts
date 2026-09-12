import type { ClothingItem } from './clothing';
import type { Outfit } from './outfit';
import type { WearHistoryRecord } from './history';
import type { CustomColorRule, CustomStyleRule } from './rules';

export interface WardrobeBackupFile {
  format: 'wardrobe-backup';
  version: 1;
  createdAt: string;
  clothing: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryRecord[];
  settings: Record<string, unknown>;
  colorRules?: CustomColorRule[];
  styleRules?: CustomStyleRule[];
}

export type ImportMode = 'replace' | 'merge';

export interface ImportPreviewData {
  clothingCount: number;
  outfitCount: number;
  historyCount: number;
  colorRuleCount: number;
  styleRuleCount: number;
  backup: WardrobeBackupFile;
}

export interface ValidationSuccess {
  isValid: true;
  data: WardrobeBackupFile;
  preview: ImportPreviewData;
}

export interface ValidationFailure {
  isValid: false;
  error: string;
  details?: string[];
}

export type BackupValidationResult = ValidationSuccess | ValidationFailure;

export interface ImportResult {
  success: boolean;
  mode: ImportMode;
  clothingAdded: number;
  outfitsAdded: number;
  historyAdded: number;
  colorRulesAdded: number;
  styleRulesAdded: number;
  error?: string;
}
