'use client';

import React from 'react';
import { Button } from './ui';
import type { ImportPreviewData, ImportMode } from '@/types/backup';

export function ExportSuccessModal({
  filename,
  stats,
  onClose,
}: {
  filename: string;
  stats: {
    clothing: number;
    outfits: number;
    history: number;
    colorRules?: number;
    styleRules?: number;
    sizeFormatted: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
          ✓
        </div>
        <h3 className="mt-4 text-xl font-semibold text-stone-900">Backup Created</h3>
        <p className="mt-1 text-sm text-stone-500">
          Your complete wardrobe has been exported to a self-contained backup file.
        </p>

        <div className="mt-5 space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          <div className="flex justify-between font-mono text-[11px] text-stone-800">
            <span>Filename</span>
            <span className="font-semibold">{filename}</span>
          </div>
          <div className="flex justify-between">
            <span>Clothing items</span>
            <span className="font-semibold text-stone-900">{stats.clothing}</span>
          </div>
          <div className="flex justify-between">
            <span>Saved outfits</span>
            <span className="font-semibold text-stone-900">{stats.outfits}</span>
          </div>
          <div className="flex justify-between">
            <span>Wear history records</span>
            <span className="font-semibold text-stone-900">{stats.history}</span>
          </div>
          {((stats.colorRules ?? 0) > 0 || (stats.styleRules ?? 0) > 0) && (
            <div className="flex justify-between">
              <span>Custom rules</span>
              <span className="font-semibold text-stone-900">
                {(stats.colorRules ?? 0) + (stats.styleRules ?? 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-200 pt-2">
            <span>File size</span>
            <span className="font-semibold text-stone-900">{stats.sizeFormatted}</span>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-4 text-stone-400">
          All images and custom rules are embedded inside this file. Store it in a safe place or transfer it to another browser.
        </p>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

export function LargeExportWarningModal({
  estimatedSizeFormatted,
  onConfirm,
  onCancel,
}: {
  estimatedSizeFormatted: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
          ⚠️
        </div>
        <h3 className="mt-4 text-xl font-semibold text-stone-900">Large Backup File Notice</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Your backup is estimated at <strong className="font-semibold text-stone-900">{estimatedSizeFormatted}</strong> because of embedded high-resolution clothing photos.
        </p>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Exporting and transferring large backup files may take a few moments depending on your device and browser memory.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Proceed with Export
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ImportPreviewModal({
  preview,
  onCancel,
  onChooseMode,
}: {
  preview: ImportPreviewData;
  onCancel: () => void;
  onChooseMode: (mode: ImportMode) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-fade-in rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Backup detected</p>
        <h3 className="mt-1 text-2xl font-semibold text-stone-900">Import Preview</h3>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          We found the following wardrobe records in this backup file:
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
            <p className="text-2xl font-bold text-stone-900">{preview.clothingCount}</p>
            <p className="mt-1 text-xs text-stone-500">Clothes</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
            <p className="text-2xl font-bold text-stone-900">{preview.outfitCount}</p>
            <p className="mt-1 text-xs text-stone-500">Outfits</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
            <p className="text-2xl font-bold text-stone-900">{preview.historyCount}</p>
            <p className="mt-1 text-xs text-stone-500">Wear history</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
            <p className="text-2xl font-bold text-stone-900">
              {preview.colorRuleCount + preview.styleRuleCount}
            </p>
            <p className="mt-1 text-xs text-stone-500">Custom rules</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Choose import mode</p>

          <button
            type="button"
            onClick={() => onChooseMode('merge')}
            className="w-full rounded-2xl border border-stone-200 p-4 text-left transition hover:border-stone-400 hover:bg-stone-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">Merge with existing wardrobe</span>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                Recommended
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Keeps all current pieces and rules. Safely adds new pieces, remaps IDs, and skips accidental duplicates.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onChooseMode('replace')}
            className="w-full rounded-2xl border border-red-200 p-4 text-left transition hover:border-red-400 hover:bg-red-50/40"
          >
            <span className="font-semibold text-red-700">Replace existing wardrobe</span>
            <p className="mt-1 text-xs text-red-600/80">
              Wipes current wardrobe in this browser and replaces it completely with the backup.
            </p>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ReplaceConfirmModal({
  itemCount,
  onConfirm,
  onCancel,
}: {
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-red-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-600">
          ⚠
        </div>
        <h3 className="mt-4 text-xl font-semibold text-stone-900">Replace entire wardrobe?</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          This will <strong className="font-semibold text-red-700">permanently delete</strong> all{' '}
          {itemCount} clothing item(s), outfits, rules, and wear history currently saved in this browser.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Only do this if you have a backup of your existing data or genuinely wish to replace everything.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Yes, Replace Everything
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InvalidBackupModal({
  error,
  details,
  onClose,
}: {
  error: string;
  details?: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-red-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
          ✕
        </div>
        <h3 className="mt-4 text-xl font-semibold text-stone-900">Invalid or Corrupted Backup</h3>
        <p className="mt-2 text-sm text-stone-600">{error}</p>

        {details && details.length > 0 && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-3 text-xs text-red-800">
            <p className="font-medium">Details:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export function QuotaErrorModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
          💾
        </div>
        <h3 className="mt-4 text-xl font-semibold text-stone-900">Storage Limit Exceeded</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Your browser&apos;s storage limit has been reached. We stopped the operation and restored your prior data safely to prevent loss.
        </p>

        <div className="mt-4 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900">
          <p className="font-semibold">Your existing data was safely preserved.</p>
          <p>Suggestions to free up space:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Deactivate or remove older clothing pieces you no longer wear.</li>
            <li>Export a backup, clean unused pieces, and re-import.</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  );
}
