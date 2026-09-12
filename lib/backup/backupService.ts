import type { ClothingItem } from '../../types/clothing';
import type { Outfit } from '../../types/outfit';
import type { WearHistoryRecord } from '../../types/history';
import type { CustomColorRule, CustomStyleRule } from '../../types/rules';
import type {
  WardrobeBackupFile,
  BackupValidationResult,
  ImportMode,
  ImportResult,
} from '../../types/backup';
import { getClothing, saveClothing } from '../storage/clothingStorage';
import { getOutfits, saveOutfits } from '../storage/outfitStorage';
import { getWearHistory, saveWearHistory } from '../storage/historyStorage';
import { getColorRules, saveColorRules, getStyleRules, saveStyleRules } from '../storage/rulesStorage';
import { read, write, clearWardrobeStorage } from '../storage/storage';
import { compressDataUrl } from '../image';

const SETTINGS_KEY = 'settings';

export function getApplicationSettings(): Record<string, unknown> {
  return read<Record<string, unknown>>(SETTINGS_KEY, {});
}

export function saveApplicationSettings(settings: Record<string, unknown>): void {
  write(SETTINGS_KEY, settings);
}

/**
 * Collects all local application data and returns a structured WardrobeBackupFile.
 * All photos are included inside the backup as Data URLs/Base64.
 * Includes user-defined color and style rules.
 */
export function createBackup(): WardrobeBackupFile {
  return {
    format: 'wardrobe-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    clothing: getClothing(),
    outfits: getOutfits(),
    wearHistory: getWearHistory(),
    settings: getApplicationSettings(),
    colorRules: getColorRules(),
    styleRules: getStyleRules(),
  };
}

/**
 * Generates and downloads a single self-contained JSON backup file named:
 * wardrobe-backup-YYYY-MM-DD.json
 */
export function downloadBackupFile(): { filename: string; sizeBytes: number } {
  const backup = createBackup();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `wardrobe-backup-${dateStr}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, sizeBytes: blob.size };
}

/**
 * Estimates backup size in bytes before initiating download
 */
export function estimateBackupSize(): number {
  const backup = createBackup();
  return JSON.stringify(backup).length * 2; // UTF-16 byte estimate
}

/**
 * Validates an imported JSON string. Checks format, version, required fields,
 * and detects corrupted or malformed entries.
 * Backwards compatible with older backups lacking custom color/style rules.
 */
export function validateBackupFile(rawJson: string): BackupValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      isValid: false,
      error: 'Corrupted backup file: The selected file is not valid JSON.',
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      isValid: false,
      error: 'Invalid backup file: Root must be a JSON object.',
    };
  }

  const obj = parsed as Record<string, unknown>;

  // 1. Validate format
  if (obj.format !== 'wardrobe-backup') {
    return {
      isValid: false,
      error: 'Unrecognized format: This file is not a Wardrobe backup file.',
    };
  }

  // 2. Validate version
  if (typeof obj.version !== 'number' || obj.version > 1 || obj.version < 1) {
    return {
      isValid: false,
      error: `Unsupported backup version (${String(obj.version)}). This app supports version 1.`,
    };
  }

  // 3. Validate required fields
  const missing: string[] = [];
  if (!Array.isArray(obj.clothing)) missing.push('clothing');
  if (!Array.isArray(obj.outfits)) missing.push('outfits');
  if (!Array.isArray(obj.wearHistory)) missing.push('wearHistory');

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Malformed backup: Missing required section(s): ${missing.join(', ')}.`,
    };
  }

  // 4. Validate clothing items schema
  const rawClothing = obj.clothing as unknown[];
  const clothingErrors: string[] = [];
  for (let i = 0; i < rawClothing.length; i++) {
    const item = rawClothing[i] as Partial<ClothingItem>;
    if (!item || typeof item !== 'object') {
      clothingErrors.push(`Item #${i + 1} is not an object.`);
      continue;
    }
    if (!item.id || typeof item.id !== 'string') {
      clothingErrors.push(`Item #${i + 1} is missing a valid ID.`);
    }
    if (!item.name || typeof item.name !== 'string') {
      clothingErrors.push(`Item #${i + 1} is missing a valid name.`);
    }
    if (!item.category || typeof item.category !== 'string') {
      clothingErrors.push(`Item #${i + 1} is missing a category.`);
    }
    if (!item.color || typeof item.color !== 'string') {
      clothingErrors.push(`Item #${i + 1} is missing a primary color.`);
    }
  }

  if (clothingErrors.length > 0) {
    return {
      isValid: false,
      error: `Malformed clothing data: Encountered ${clothingErrors.length} validation error(s) in clothing items.`,
      details: clothingErrors.slice(0, 5),
    };
  }

  // Extract custom rules if present (either top-level or inside settings)
  const rawColorRules = Array.isArray(obj.colorRules)
    ? obj.colorRules
    : Array.isArray((obj.settings as any)?.colorRules)
    ? (obj.settings as any).colorRules
    : [];

  const rawStyleRules = Array.isArray(obj.styleRules)
    ? obj.styleRules
    : Array.isArray((obj.settings as any)?.styleRules)
    ? (obj.settings as any).styleRules
    : [];

  const colorRules: CustomColorRule[] = rawColorRules.map((r: any) => ({
    id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
    name: typeof r.name === 'string' ? r.name : undefined,
    colors: Array.isArray(r.colors) ? r.colors : [],
    enabled: r.enabled !== false,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  }));

  const styleRules: CustomStyleRule[] = rawStyleRules.map((r: any) => ({
    id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
    name: typeof r.name === 'string' ? r.name : undefined,
    categories: Array.isArray(r.categories) ? r.categories : [],
    enabled: r.enabled !== false,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  }));

  const backupData: WardrobeBackupFile = {
    format: 'wardrobe-backup',
    version: 1,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    clothing: (obj.clothing as ClothingItem[]).map((c) => ({
      ...c,
      secondaryColors: Array.isArray(c.secondaryColors) ? c.secondaryColors : [],
      styles: Array.isArray(c.styles) ? c.styles : ['casual'],
      temperatures: Array.isArray(c.temperatures) ? c.temperatures : ['all'],
      seasons: Array.isArray(c.seasons) ? c.seasons : ['all'],
      occasions: Array.isArray(c.occasions) ? c.occasions : ['casual'],
      isActive: c.isActive !== false,
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    })),
    outfits: (obj.outfits as Outfit[]).map((o) => ({
      ...o,
      occasions: Array.isArray(o.occasions) ? o.occasions : [],
      styles: Array.isArray(o.styles) ? o.styles : [],
      timesWorn: typeof o.timesWorn === 'number' ? o.timesWorn : 0,
      lastWornAt: o.lastWornAt ?? null,
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || new Date().toISOString(),
    })),
    wearHistory: (obj.wearHistory as WearHistoryRecord[]).map((w) => ({
      id: w.id || crypto.randomUUID(),
      outfitId: w.outfitId,
      wornAt: w.wornAt || new Date().toISOString(),
    })),
    settings: (typeof obj.settings === 'object' && obj.settings !== null ? obj.settings : {}) as Record<string, unknown>,
    colorRules,
    styleRules,
  };

  return {
    isValid: true,
    data: backupData,
    preview: {
      clothingCount: backupData.clothing.length,
      outfitCount: backupData.outfits.length,
      historyCount: backupData.wearHistory.length,
      colorRuleCount: colorRules.length,
      styleRuleCount: styleRules.length,
      backup: backupData,
    },
  };
}

/**
 * Executes either a Replace or Merge import into local storage / IndexedDB.
 * In case of storage quota error, guarantees rollback to previous state (atomic import).
 */
export async function executeImport(
  backup: WardrobeBackupFile,
  mode: ImportMode
): Promise<ImportResult> {
  // Snapshot current state for atomic rollback
  const previousClothing = getClothing();
  const previousOutfits = getOutfits();
  const previousHistory = getWearHistory();
  const previousSettings = getApplicationSettings();
  const previousColorRules = getColorRules();
  const previousStyleRules = getStyleRules();

  try {
    // Optimize images with safe compression
    const preparedClothing: ClothingItem[] = [];
    for (const item of backup.clothing) {
      const optimizedImage = await compressDataUrl(item.image);
      preparedClothing.push({
        ...item,
        image: optimizedImage,
      });
    }

    if (mode === 'replace') {
      clearWardrobeStorage();
      saveClothing(preparedClothing);
      saveOutfits(backup.outfits);
      saveWearHistory(backup.wearHistory);
      if (backup.settings) {
        saveApplicationSettings(backup.settings);
      }
      saveColorRules(backup.colorRules ?? []);
      saveStyleRules(backup.styleRules ?? []);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wardrobe:changed'));
      }

      return {
        success: true,
        mode: 'replace',
        clothingAdded: preparedClothing.length,
        outfitsAdded: backup.outfits.length,
        historyAdded: backup.wearHistory.length,
        colorRulesAdded: (backup.colorRules ?? []).length,
        styleRulesAdded: (backup.styleRules ?? []).length,
      };
    }

    // --- MERGE MODE ---
    const clothingIdMap = new Map<string, string>();
    const existingClothing = [...previousClothing];
    let clothingAddedCount = 0;

    for (const importedItem of preparedClothing) {
      // Duplicate check (exact match on name, category, color, and image)
      const existingMatch = existingClothing.find(
        (c) =>
          c.name.trim().toLowerCase() === importedItem.name.trim().toLowerCase() &&
          c.category === importedItem.category &&
          c.color === importedItem.color &&
          c.image === importedItem.image
      );

      if (existingMatch) {
        clothingIdMap.set(importedItem.id, existingMatch.id);
        continue;
      }

      // ID Collision check
      const idCollision = existingClothing.some((c) => c.id === importedItem.id);
      const finalId = idCollision ? crypto.randomUUID() : importedItem.id;
      clothingIdMap.set(importedItem.id, finalId);

      existingClothing.push({
        ...importedItem,
        id: finalId,
      });
      clothingAddedCount++;
    }

    // Remap outfits
    const outfitIdMap = new Map<string, string>();
    const existingOutfits = [...previousOutfits];
    const allClothingIds = new Set(existingClothing.map((c) => c.id));
    let outfitsAddedCount = 0;

    for (const importedOutfit of backup.outfits) {
      const remappedTopId = clothingIdMap.get(importedOutfit.topId) ?? importedOutfit.topId;
      const remappedBottomId = clothingIdMap.get(importedOutfit.bottomId) ?? importedOutfit.bottomId;
      const remappedShoesId = clothingIdMap.get(importedOutfit.shoesId) ?? importedOutfit.shoesId;
      const remappedOuterId = importedOutfit.outerwearId
        ? (clothingIdMap.get(importedOutfit.outerwearId) ?? importedOutfit.outerwearId)
        : undefined;

      // Only add outfit if all referenced clothing pieces exist
      if (
        !allClothingIds.has(remappedTopId) ||
        !allClothingIds.has(remappedBottomId) ||
        !allClothingIds.has(remappedShoesId) ||
        (remappedOuterId && !allClothingIds.has(remappedOuterId))
      ) {
        continue;
      }

      // Duplicate outfit check
      const duplicateOutfit = existingOutfits.find(
        (o) =>
          o.topId === remappedTopId &&
          o.bottomId === remappedBottomId &&
          o.shoesId === remappedShoesId &&
          o.outerwearId === remappedOuterId
      );

      if (duplicateOutfit) {
        outfitIdMap.set(importedOutfit.id, duplicateOutfit.id);
        continue;
      }

      // ID collision check
      const outfitIdCollision = existingOutfits.some((o) => o.id === importedOutfit.id);
      const finalOutfitId = outfitIdCollision
        ? [remappedTopId, remappedBottomId, remappedShoesId, remappedOuterId ?? 'none'].join('_')
        : importedOutfit.id;
      outfitIdMap.set(importedOutfit.id, finalOutfitId);

      existingOutfits.push({
        ...importedOutfit,
        id: finalOutfitId,
        topId: remappedTopId,
        bottomId: remappedBottomId,
        shoesId: remappedShoesId,
        outerwearId: remappedOuterId,
      });
      outfitsAddedCount++;
    }

    // Remap wear history
    const existingHistory = [...previousHistory];
    const allOutfitIds = new Set(existingOutfits.map((o) => o.id));
    let historyAddedCount = 0;

    for (const importedRecord of backup.wearHistory) {
      const remappedOutfitId = outfitIdMap.get(importedRecord.outfitId) ?? importedRecord.outfitId;
      if (!allOutfitIds.has(remappedOutfitId)) {
        continue;
      }

      const duplicateRecord = existingHistory.some(
        (h) => h.outfitId === remappedOutfitId && h.wornAt === importedRecord.wornAt
      );
      if (duplicateRecord) continue;

      const idCollision = existingHistory.some((h) => h.id === importedRecord.id);
      const finalId = idCollision ? crypto.randomUUID() : importedRecord.id;

      existingHistory.push({
        id: finalId,
        outfitId: remappedOutfitId,
        wornAt: importedRecord.wornAt,
      });
      historyAddedCount++;
    }

    // Merge Custom Color Rules
    const existingColorRules = [...previousColorRules];
    let colorRulesAddedCount = 0;
    for (const rule of backup.colorRules ?? []) {
      const sortedColors = [...rule.colors].sort().join('|');
      const isDuplicate = existingColorRules.some(
        (r) => [...r.colors].sort().join('|') === sortedColors
      );
      if (isDuplicate) continue;

      const idCollision = existingColorRules.some((r) => r.id === rule.id);
      const finalId = idCollision ? crypto.randomUUID() : rule.id;
      existingColorRules.push({
        ...rule,
        id: finalId,
      });
      colorRulesAddedCount++;
    }

    // Merge Custom Style Rules
    const existingStyleRules = [...previousStyleRules];
    let styleRulesAddedCount = 0;
    for (const rule of backup.styleRules ?? []) {
      const sortedCategories = [...rule.categories].sort().join('|');
      const isDuplicate = existingStyleRules.some(
        (r) => [...r.categories].sort().join('|') === sortedCategories
      );
      if (isDuplicate) continue;

      const idCollision = existingStyleRules.some((r) => r.id === rule.id);
      const finalId = idCollision ? crypto.randomUUID() : rule.id;
      existingStyleRules.push({
        ...rule,
        id: finalId,
      });
      styleRulesAddedCount++;
    }

    // Save all merged data
    saveClothing(existingClothing);
    saveOutfits(existingOutfits);
    saveWearHistory(existingHistory);
    saveColorRules(existingColorRules);
    saveStyleRules(existingStyleRules);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wardrobe:changed'));
    }

    return {
      success: true,
      mode: 'merge',
      clothingAdded: clothingAddedCount,
      outfitsAdded: outfitsAddedCount,
      historyAdded: historyAddedCount,
      colorRulesAdded: colorRulesAddedCount,
      styleRulesAdded: styleRulesAddedCount,
    };
  } catch (error) {
    // Atomic rollback on failure
    try {
      saveClothing(previousClothing);
      saveOutfits(previousOutfits);
      saveWearHistory(previousHistory);
      saveApplicationSettings(previousSettings);
      saveColorRules(previousColorRules);
      saveStyleRules(previousStyleRules);
    } catch {
      // rollback attempted
    }

    const isQuota =
      (error instanceof DOMException && error.name === 'QuotaExceededError') ||
      (error instanceof Error && error.message.includes('quota'));

    const message = isQuota
      ? 'Storage quota exceeded. The backup could not be imported.'
      : error instanceof Error
      ? error.message
      : 'Import failed due to an unexpected error.';

    const err = new Error(message);
    if (isQuota) err.name = 'QuotaExceededError';
    throw err;
  }
}
