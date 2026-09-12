'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getClothing } from '@/lib/storage/clothingStorage';
import { getOutfits } from '@/lib/storage/outfitStorage';
import { getWearHistory } from '@/lib/storage/historyStorage';
import { getDetailedStorageStats, type StorageReport } from '@/lib/storage/storage';
import {
  downloadBackupFile,
  validateBackupFile,
  executeImport,
  estimateBackupSize,
} from '@/lib/backup/backupService';
import {
  getColorRules,
  saveColorRules,
  addColorRule,
  toggleColorRule,
  deleteColorRule,
  getStyleRules,
  saveStyleRules,
  addStyleRule,
  toggleStyleRule,
  deleteStyleRule,
} from '@/lib/storage/rulesStorage';
import type { ImportMode, ImportPreviewData } from '@/types/backup';
import type { CustomColorRule, CustomStyleRule } from '@/types/rules';
import {
  COLORS,
  COLOR_LABELS,
  COLOR_HEX,
  CATEGORIES,
  type Color,
  type Category,
} from '@/types/clothing';
import { Button, Chip, Stat } from '@/components/ui';
import {
  ExportSuccessModal,
  ImportPreviewModal,
  ReplaceConfirmModal,
  InvalidBackupModal,
  QuotaErrorModal,
  LargeExportWarningModal,
} from '@/components/BackupModals';

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({
    items: 0,
    outfits: 0,
    history: 0,
  });

  const [storageReport, setStorageReport] = useState<StorageReport>({
    storageType: 'IndexedDB',
    usedBytes: 0,
    formattedUsage: 'Calculating…',
    formattedQuota: 'Calculating…',
    percentUsed: 0,
    isEstimateAvailable: false,
    migrationStatus: 'indexeddb_active',
  });

  const [colorRules, setColorRules] = useState<CustomColorRule[]>([]);
  const [styleRules, setStyleRules] = useState<CustomStyleRule[]>([]);

  // Form states for new color rule
  const [newColorName, setNewColorName] = useState('');
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [colorFormError, setColorFormError] = useState('');

  // Form states for new style rule
  const [newStyleName, setNewStyleName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [styleFormError, setStyleFormError] = useState('');

  const [busy, setBusy] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [exportModalData, setExportModalData] = useState<{
    filename: string;
    stats: {
      clothing: number;
      outfits: number;
      history: number;
      colorRules?: number;
      styleRules?: number;
      sizeFormatted: string;
    };
  } | null>(null);

  const [largeExportSize, setLargeExportSize] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [errorModal, setErrorModal] = useState<{ error: string; details?: string[] } | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const refresh = async () => {
    const clothing = getClothing();
    const outfits = getOutfits();
    const history = getWearHistory();
    setStats({
      items: clothing.length,
      outfits: outfits.length,
      history: history.length,
    });
    setColorRules(getColorRules());
    setStyleRules(getStyleRules());

    try {
      const rep = await getDetailedStorageStats();
      setStorageReport(rep);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener('wardrobe:changed', refresh);
    window.addEventListener('wardrobe:ready', refresh);
    return () => {
      window.removeEventListener('wardrobe:changed', refresh);
      window.removeEventListener('wardrobe:ready', refresh);
    };
  }, []);

  const handleCreateBackup = (bypassWarning = false) => {
    try {
      const estimatedBytes = estimateBackupSize();
      if (!bypassWarning && estimatedBytes > 20 * 1024 * 1024) {
        const sizeFormatted = `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
        setLargeExportSize(sizeFormatted);
        return;
      }

      setBusy(true);
      const { filename, sizeBytes } = downloadBackupFile();
      const formattedSize =
        sizeBytes < 1024 * 1024
          ? `${(sizeBytes / 1024).toFixed(1)} KB`
          : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

      setExportModalData({
        filename,
        stats: {
          clothing: stats.items,
          outfits: stats.outfits,
          history: stats.history,
          colorRules: colorRules.length,
          styleRules: styleRules.length,
          sizeFormatted: formattedSize,
        },
      });
    } catch (err) {
      setErrorModal({
        error: err instanceof Error ? err.message : 'Could not generate backup file.',
      });
    } finally {
      setBusy(false);
      setLargeExportSize(null);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorModal({
        error: 'Could not read the selected backup file. Check file permissions.',
      });
    };
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const validation = validateBackupFile(content);
      if (!validation.isValid) {
        setErrorModal({
          error: validation.error,
          details: validation.details,
        });
        return;
      }
      setPreviewData(validation.preview);
    };
    reader.readAsText(file);
  };

  const handleChooseMode = (mode: ImportMode) => {
    if (!previewData) return;
    if (mode === 'replace') {
      setShowReplaceConfirm(true);
    } else {
      performImport('merge');
    }
  };

  const performImport = async (mode: ImportMode) => {
    if (!previewData) return;
    setBusy(true);
    try {
      const result = await executeImport(previewData.backup, mode);
      setPreviewData(null);
      setShowReplaceConfirm(false);
      await refresh();

      const ruleSummary =
        result.colorRulesAdded + result.styleRulesAdded > 0
          ? ` and ${result.colorRulesAdded + result.styleRulesAdded} custom rules`
          : '';

      setSuccessToast(
        mode === 'replace'
          ? `Wardrobe replaced: Imported ${result.clothingAdded} items, ${result.outfitsAdded} outfits, ${result.historyAdded} wear records${ruleSummary}.`
          : `Wardrobe merged: Added ${result.clothingAdded} new items, ${result.outfitsAdded} outfits, ${result.historyAdded} wear records${ruleSummary}.`
      );
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err) {
      setPreviewData(null);
      setShowReplaceConfirm(false);
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        setShowQuotaModal(true);
      } else {
        setErrorModal({
          error: err instanceof Error ? err.message : 'Import failed.',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  // Color rule handlers
  const handleAddColorRule = (e: React.FormEvent) => {
    e.preventDefault();
    setColorFormError('');
    const res = addColorRule({
      name: newColorName,
      colors: selectedColors,
      enabled: true,
    });
    if (!res.success) {
      setColorFormError(res.error || 'Could not add color rule.');
      return;
    }
    setNewColorName('');
    setSelectedColors([]);
    refresh();
  };

  // Style rule handlers
  const handleAddStyleRule = (e: React.FormEvent) => {
    e.preventDefault();
    setStyleFormError('');
    const res = addStyleRule({
      name: newStyleName,
      categories: selectedCategories,
      enabled: true,
    });
    if (!res.success) {
      setStyleFormError(res.error || 'Could not add style rule.');
      return;
    }
    setNewStyleName('');
    setSelectedCategories([]);
    refresh();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400">Settings & Rules</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Customization & Data</h1>
          <p className="mt-2 text-sm text-stone-500">
            Customize outfit color/style rules, monitor storage capacity, and create self-contained backups.
          </p>
        </div>
        <Link href="/wardrobe">
          <Button variant="light">← Back to wardrobe</Button>
        </Link>
      </div>

      {successToast && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <span>{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="ml-4 font-semibold text-emerald-900 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Storage & Engine Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active Clothes" value={stats.items} detail="Stored locally" />
        <Stat label="Saved Outfits" value={stats.outfits} detail="Generated combinations" />
        <Stat
          label="Storage Engine"
          value={storageReport.storageType}
          detail={
            storageReport.migrationStatus === 'migrated'
              ? 'Migrated from localStorage'
              : 'IndexedDB persistent store'
          }
        />
        <Stat
          label="Estimated Usage"
          value={storageReport.formattedUsage}
          detail={`Quota: ${storageReport.formattedQuota}`}
        />
      </section>

      {/* SECTION 1: CUSTOM COLOR COMBINATIONS */}
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-lg text-white">
              🎨
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">Custom Color Combinations</h2>
              <p className="text-xs text-stone-500">
                Define preferred color palettes. The recommendation engine applies a bounded ranking bonus.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Add Color Rule Form */}
          <form onSubmit={handleAddColorRule} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">Create New Color Combination</h3>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400">
                Rule Name (Optional)
              </label>
              <input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="e.g. Navy & Cream Autumn, Parisian Monochrome"
                className="input bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-400">
                Select 2 or more colors ({selectedColors.length} selected)
              </label>
              <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1">
                {COLORS.map((c) => {
                  const isSelected = selectedColors.includes(c);
                  return (
                    <Chip
                      key={c}
                      active={isSelected}
                      onClick={() =>
                        setSelectedColors(
                          isSelected
                            ? selectedColors.filter((x) => x !== c)
                            : [...selectedColors, c]
                        )
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full border border-stone-300"
                          style={{ background: COLOR_HEX[c] }}
                        />
                        {COLOR_LABELS[c]}
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </div>

            {colorFormError && (
              <p className="rounded-xl bg-red-50 p-2 text-xs font-medium text-red-600">
                {colorFormError}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={selectedColors.length < 2}>
                Save Color Combination
              </Button>
            </div>
          </form>

          {/* List of Saved Color Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Active Color Rules ({colorRules.length})
            </h3>
            {colorRules.length === 0 ? (
              <p className="text-xs text-stone-500 italic">
                No custom color rules added yet. Outfits will use the 42-color compatibility engine heuristics.
              </p>
            ) : (
              <div className="space-y-2">
                {colorRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                      rule.enabled
                        ? 'border-stone-200 bg-white'
                        : 'border-stone-200/60 bg-stone-50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-stone-900">
                          {rule.name || rule.colors.map((c) => COLOR_LABELS[c]).join(' + ')}
                        </span>
                        {!rule.enabled && (
                          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] text-stone-600">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.colors.map((c) => (
                          <span
                            key={c}
                            className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: COLOR_HEX[c] }}
                            />
                            {COLOR_LABELS[c]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="light"
                        onClick={() => {
                          toggleColorRule(rule.id);
                          refresh();
                        }}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          deleteColorRule(rule.id);
                          refresh();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: CUSTOM STYLE COMBINATIONS */}
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-lg text-white">
              👔
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">Custom Style Combinations</h2>
              <p className="text-xs text-stone-500">
                Define preferred garment type pairings (e.g. Shirt + Jeans). Recommendation and Regenerate prefer these pairings.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Add Style Rule Form */}
          <form onSubmit={handleAddStyleRule} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">Create New Style Combination</h3>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-400">
                Rule Name (Optional)
              </label>
              <input
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="e.g. Smart Casual Shirt & Jeans, Athleisure Combo"
                className="input bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-400">
                Select 2 or more clothing categories ({selectedCategories.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <Chip
                      key={cat}
                      active={isSelected}
                      onClick={() =>
                        setSelectedCategories(
                          isSelected
                            ? selectedCategories.filter((x) => x !== cat)
                            : [...selectedCategories, cat]
                        )
                      }
                    >
                      {cat}
                    </Chip>
                  );
                })}
              </div>
            </div>

            {styleFormError && (
              <p className="rounded-xl bg-red-50 p-2 text-xs font-medium text-red-600">
                {styleFormError}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={selectedCategories.length < 2}>
                Save Style Combination
              </Button>
            </div>
          </form>

          {/* List of Saved Style Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Active Style Rules ({styleRules.length})
            </h3>
            {styleRules.length === 0 ? (
              <p className="text-xs text-stone-500 italic">
                No custom style combinations added yet. Recommendations will use standard occasion and weather styling.
              </p>
            ) : (
              <div className="space-y-2">
                {styleRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                      rule.enabled
                        ? 'border-stone-200 bg-white'
                        : 'border-stone-200/60 bg-stone-50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-stone-900">
                          {rule.name || rule.categories.join(' + ')}
                        </span>
                        {!rule.enabled && (
                          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] text-stone-600">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.categories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-700"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="light"
                        onClick={() => {
                          toggleStyleRule(rule.id);
                          refresh();
                        }}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          deleteStyleRule(rule.id);
                          refresh();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: BACKUP & RESTORE */}
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-lg text-white">
              📦
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">Backup & Restore</h2>
              <p className="text-xs text-stone-500">100% client-side · Self-contained JSON with photos & rules</p>
            </div>
          </div>

          {/* Security Notice Warning */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-xs leading-5 text-amber-900">
            <span className="text-base leading-none">⚠️</span>
            <p>
              <strong>Security Notice:</strong> Backup files contain your wardrobe information and clothing photos. Only share backup files with people you trust.
            </p>
          </div>
        </div>

        <div className="grid gap-6 bg-stone-50/50 p-6 sm:grid-cols-2 sm:p-8">
          {/* Create Backup */}
          <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Export</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-900">Create Backup</h3>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Exports all clothing photos, metadata, outfits, rotation history, and custom rules into a single self-contained JSON file.
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => handleCreateBackup(false)} disabled={busy} className="w-full sm:w-auto">
                {busy ? 'Exporting…' : 'Create Backup (.json)'}
              </Button>
            </div>
          </div>

          {/* Import Backup */}
          <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Restore</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-900">Import Backup</h3>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Select a backup file. Preview your pieces, outfits, and rules before choosing whether to merge or replace.
              </p>
            </div>
            <div className="mt-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelected}
                className="hidden"
              />
              <Button
                variant="light"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="w-full sm:w-auto"
              >
                {busy ? 'Processing…' : 'Import Backup…'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: STORAGE & PRIVACY ARCHITECTURE */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-stone-900">Browser Storage & Privacy</h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-3 text-xs leading-5 text-stone-600">
          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="font-semibold text-stone-900">IndexedDB Storage</h4>
            <p className="mt-1 text-stone-500">
              Your digital wardrobe is stored in your browser&apos;s native IndexedDB database, offering ample capacity for clothing photos without the 5MB limits of localStorage.
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="font-semibold text-stone-900">Self-Contained Exports</h4>
            <p className="mt-1 text-stone-500">
              When creating a backup, all photos and custom rules are packaged inside a single JSON file without relying on external cloud URLs.
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="font-semibold text-stone-900">Atomic & Collision-Safe</h4>
            <p className="mt-1 text-stone-500">
              Merging automatically generates non-colliding IDs and remaps cross-references. If an import fails, previous data is safely rolled back.
            </p>
          </div>
        </div>
      </section>

      {/* Modals */}
      {exportModalData && (
        <ExportSuccessModal
          filename={exportModalData.filename}
          stats={exportModalData.stats}
          onClose={() => setExportModalData(null)}
        />
      )}

      {largeExportSize && (
        <LargeExportWarningModal
          estimatedSizeFormatted={largeExportSize}
          onConfirm={() => handleCreateBackup(true)}
          onCancel={() => setLargeExportSize(null)}
        />
      )}

      {previewData && (
        <ImportPreviewModal
          preview={previewData}
          onCancel={() => setPreviewData(null)}
          onChooseMode={handleChooseMode}
        />
      )}

      {showReplaceConfirm && (
        <ReplaceConfirmModal
          itemCount={stats.items}
          onConfirm={() => performImport('replace')}
          onCancel={() => setShowReplaceConfirm(false)}
        />
      )}

      {errorModal && (
        <InvalidBackupModal
          error={errorModal.error}
          details={errorModal.details}
          onClose={() => setErrorModal(null)}
        />
      )}

      {showQuotaModal && (
        <QuotaErrorModal onClose={() => setShowQuotaModal(false)} />
      )}
    </div>
  );
}
