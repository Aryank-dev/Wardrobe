import { idbGet, idbSet, idbDel, idbClear, isIdbSupported } from './idb';

export const PREFIX = 'wardrobe:';

// In-memory cache to ensure synchronous component reads (read<T>) are instantaneous
const memoryCache = new Map<string, unknown>();
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let migrationStatus: 'none' | 'migrated' | 'indexeddb_active' = 'none';

/**
 * Initialize storage on browser load:
 * 1. Checks IndexedDB.
 * 2. If IndexedDB is empty and localStorage has existing data, securely migrates data.
 * 3. Populates the memoryCache.
 * 4. Dispatches 'wardrobe:ready' and 'wardrobe:changed'.
 */
export async function initStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!isIdbSupported()) {
        // Fallback to localStorage
        loadFromLocalStorageToMemory();
        isInitialized = true;
        return;
      }

      // Preload keys we know about
      const primaryKeys = ['clothing', 'outfits', 'wear-history', 'settings', 'color-rules', 'style-rules'];
      const idbValues: Record<string, unknown> = {};

      for (const key of primaryKeys) {
        const val = await idbGet(key);
        if (val !== undefined) {
          idbValues[key] = val;
        }
      }

      const hasIdbData = Object.keys(idbValues).length > 0;

      if (!hasIdbData) {
        // Check if there is data in localStorage to migrate
        let foundLocalStorageData = false;
        for (const key of primaryKeys) {
          const raw = window.localStorage.getItem(PREFIX + key);
          if (raw) {
            foundLocalStorageData = true;
            try {
              const parsed = JSON.parse(raw);
              await idbSet(key, parsed);
              memoryCache.set(key, parsed);
            } catch {
              // Ignore corrupt localStorage key
            }
          }
        }

        if (foundLocalStorageData) {
          migrationStatus = 'migrated';
          // Keep localStorage as fallback backup; do not immediately wipe
        } else {
          migrationStatus = 'indexeddb_active';
        }
      } else {
        migrationStatus = 'indexeddb_active';
        for (const [k, v] of Object.entries(idbValues)) {
          memoryCache.set(k, v);
        }
      }

      isInitialized = true;
      window.dispatchEvent(new Event('wardrobe:ready'));
      window.dispatchEvent(new Event('wardrobe:changed'));
    } catch {
      // If IndexedDB fails, fall back to localStorage
      loadFromLocalStorageToMemory();
      isInitialized = true;
    }
  })();

  return initPromise;
}

function loadFromLocalStorageToMemory() {
  if (typeof window === 'undefined') return;
  const primaryKeys = ['clothing', 'outfits', 'wear-history', 'settings', 'color-rules', 'style-rules'];
  for (const k of primaryKeys) {
    const raw = window.localStorage.getItem(PREFIX + k);
    if (raw) {
      try {
        memoryCache.set(k, JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }
}

// Auto-initiate in browser environment immediately
if (typeof window !== 'undefined') {
  initStorage().catch(() => {});
}

export function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }

  // Fallback to localStorage if memory cache not yet primed
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }

  return fallback;
}

export function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  // 1. Immediately update memory cache for synchronous UI consistency
  memoryCache.set(key, value);

  // 2. Persist to IndexedDB asynchronously
  if (isIdbSupported()) {
    idbSet(key, value).catch(() => {
      // If IndexedDB write fails, attempt to save to localStorage as emergency fallback
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // quota exceeded
      }
    });
  } else {
    // Pure localStorage environment
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      const isQuota =
        (error instanceof DOMException &&
          (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014)) ||
        (typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'QuotaExceededError');
      const message = isQuota
        ? 'Browser storage quota exceeded. Consider exporting a backup and clearing unused pieces.'
        : 'Could not save to local storage.';
      const err = new Error(message);
      if (isQuota) err.name = 'QuotaExceededError';
      throw err;
    }
  }
}

export async function writeAsync<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;
  memoryCache.set(key, value);
  if (isIdbSupported()) {
    await idbSet(key, value);
  } else {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }
}

export function remove(key: string): void {
  if (typeof window === 'undefined') return;
  memoryCache.delete(key);
  if (isIdbSupported()) {
    idbDel(key).catch(() => {});
  }
  window.localStorage.removeItem(PREFIX + key);
}

export function clearWardrobeStorage(): void {
  if (typeof window === 'undefined') return;
  memoryCache.clear();
  if (isIdbSupported()) {
    idbClear().catch(() => {});
  }
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      keysToRemove.push(k);
    }
  }
  for (const k of keysToRemove) {
    window.localStorage.removeItem(k);
  }
}

export interface StorageReport {
  storageType: 'IndexedDB' | 'localStorage';
  usedBytes: number;
  quotaBytes?: number;
  formattedUsage: string;
  formattedQuota: string;
  percentUsed: number;
  isEstimateAvailable: boolean;
  migrationStatus: 'none' | 'migrated' | 'indexeddb_active';
}

export async function getDetailedStorageStats(): Promise<StorageReport> {
  const isIdb = isIdbSupported();
  let usedBytes = 0;
  let quotaBytes: number | undefined;
  let isEstimateAvailable = false;

  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.usage === 'number') {
        usedBytes = estimate.usage;
        isEstimateAvailable = true;
      }
      if (typeof estimate.quota === 'number') {
        quotaBytes = estimate.quota;
      }
    } catch {
      // Estimate API failed; fallback to manual calculation
    }
  }

  // If estimate not available or returned 0, approximate from in-memory cache
  if (usedBytes === 0) {
    for (const [, val] of memoryCache.entries()) {
      try {
        usedBytes += JSON.stringify(val).length * 2;
      } catch {
        // ignore
      }
    }
    if (!isIdb) {
      quotaBytes = 5 * 1024 * 1024; // 5MB standard localStorage
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const percentUsed = quotaBytes && quotaBytes > 0
    ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100))
    : 0;

  return {
    storageType: isIdb ? 'IndexedDB' : 'localStorage',
    usedBytes,
    quotaBytes,
    formattedUsage: formatSize(usedBytes),
    formattedQuota: quotaBytes ? formatSize(quotaBytes) : 'Browser Managed',
    percentUsed,
    isEstimateAvailable,
    migrationStatus,
  };
}

export function getStorageStats(): { usedBytes: number; formatted: string; percent: number } {
  let bytes = 0;
  for (const [, val] of memoryCache.entries()) {
    try {
      bytes += JSON.stringify(val).length * 2;
    } catch {
      // ignore
    }
  }
  const formatted = bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return { usedBytes: bytes, formatted, percent: Math.min(100, Math.round((bytes / (50 * 1024 * 1024)) * 100)) };
}
