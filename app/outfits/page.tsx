'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getClothing } from '@/lib/storage/clothingStorage';
import { getOutfits, saveOutfits } from '@/lib/storage/outfitStorage';
import { addWearHistory } from '@/lib/storage/historyStorage';
import { generateOutfits, generateSingleCombination } from '@/engine';
import type { ClothingItem } from '@/types/clothing';
import type { Outfit } from '@/types/outfit';
import { OutfitCard } from '@/components/OutfitCard';
import { Button, EmptyState, Chip } from '@/components/ui';

export default function Outfits() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [sort, setSort] = useState<'score' | 'newest' | 'worn' | 'recent'>('score');

  // Regenerate feature states
  const [spotlightOutfit, setSpotlightOutfit] = useState<Outfit | null>(null);
  const [recentGeneratedIds, setRecentGeneratedIds] = useState<string[]>([]);
  const [regenerateMessage, setRegenerateMessage] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    const i = getClothing();
    const existing = getOutfits();
    const o = generateOutfits(i, existing);
    if (JSON.stringify(o) !== JSON.stringify(existing)) {
      saveOutfits(o);
    }
    setItems(i);
    setOutfits(o);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('wardrobe:changed', loadData);
    return () => window.removeEventListener('wardrobe:changed', loadData);
  }, []);

  function worn(o: Outfit) {
    const next = {
      ...o,
      timesWorn: o.timesWorn + 1,
      lastWornAt: new Date().toISOString(),
      score: { ...o.score },
    };
    const arr = outfits.map((x) => (x.id === o.id ? next : x));
    if (!arr.some((x) => x.id === o.id)) {
      arr.unshift(next);
    }
    saveOutfits(arr);
    addWearHistory(o.id);
    const regenerated = generateOutfits(items, arr);
    saveOutfits(regenerated);
    setOutfits(regenerated);
    if (spotlightOutfit?.id === o.id) {
      setSpotlightOutfit(next);
    }
    window.dispatchEvent(new Event('wardrobe:changed'));
  }

  const handleRegenerate = () => {
    setRegenerateMessage(null);
    setSavedSuccessMsg(null);

    const result = generateSingleCombination({
      items,
      currentOutfitId: spotlightOutfit?.id,
      existing: outfits,
      excludedOutfitIds: recentGeneratedIds,
    });

    if (!result.success) {
      setRegenerateMessage(result.message);
      return;
    }

    setSpotlightOutfit(result.outfit);
    setRecentGeneratedIds((prev) => [result.outfit.id, ...prev.slice(0, 5)]);
  };

  const handleSaveSpotlightOutfit = () => {
    if (!spotlightOutfit) return;
    const exists = outfits.some((o) => o.id === spotlightOutfit.id);
    if (!exists) {
      const updated = [spotlightOutfit, ...outfits];
      saveOutfits(updated);
      setOutfits(updated);
      window.dispatchEvent(new Event('wardrobe:changed'));
    }
    setSavedSuccessMsg('Outfit saved to your saved looks library!');
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  const sorted = useMemo(
    () =>
      [...outfits].sort((a, b) =>
        sort === 'score'
          ? b.score.total - a.score.total
          : sort === 'newest'
          ? b.createdAt.localeCompare(a.createdAt)
          : sort === 'worn'
          ? b.timesWorn - a.timesWorn
          : String(b.lastWornAt ?? '').localeCompare(String(a.lastWornAt ?? ''))
      ),
    [outfits, sort]
  );

  return (
    <div className="space-y-8">
      {/* Header with Regenerate Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400">Outfit library</p>
          <h1 className="mt-1 text-4xl font-semibold">Saved looks</h1>
          <p className="mt-2 text-sm text-stone-500">
            {outfits.length} combinations from your active wardrobe.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRegenerate} className="flex items-center gap-1.5">
            <span>✨</span>
            <span>Generate New Combination</span>
          </Button>
          <Button
            variant="light"
            onClick={() => {
              const next = generateOutfits(items, outfits);
              saveOutfits(next);
              setOutfits(next);
            }}
          >
            Re-score All
          </Button>
        </div>
      </div>

      {/* Insufficient Items / Feedback Message */}
      {regenerateMessage && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
          <span>⚠️ {regenerateMessage}</span>
          <Link href="/wardrobe/add" className="ml-4 font-semibold text-amber-950 underline">
            Add Pieces →
          </Link>
        </div>
      )}

      {/* Saved Toast */}
      {savedSuccessMsg && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span>✓ {savedSuccessMsg}</span>
          <button onClick={() => setSavedSuccessMsg(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Freshly Generated Combination Spotlight */}
      {spotlightOutfit && (
        <section className="animate-fade-in rounded-3xl border-2 border-stone-900 bg-stone-50/70 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                  ✨ Freshly Generated Combination
                </span>
                {spotlightOutfit.score.customBonus && spotlightOutfit.score.customBonus > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                    +{spotlightOutfit.score.customBonus} Custom Rule Bonus
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Scored by the compatibility engine using color harmony and your custom preference rules.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="light" onClick={handleRegenerate}>
                Next Combination →
              </Button>
              <Button onClick={handleSaveSpotlightOutfit}>
                Save to Outfits
              </Button>
            </div>
          </div>

          <div className="max-w-md">
            <OutfitCard outfit={spotlightOutfit} items={items} onWorn={worn} />
          </div>
        </section>
      )}

      {/* Filter and Sort Chips */}
      <div className="flex flex-wrap gap-2">
        {(['score', 'newest', 'worn', 'recent'] as const).map((x) => (
          <Chip key={x} active={sort === x} onClick={() => setSort(x)}>
            {x === 'score'
              ? 'Highest score'
              : x === 'newest'
              ? 'Newest'
              : x === 'worn'
              ? 'Most worn'
              : 'Recently worn'}
          </Chip>
        ))}
      </div>

      {/* Outfit Grid */}
      {sorted.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((o) => (
            <OutfitCard key={o.id} outfit={o} items={items} onWorn={worn} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Not enough pieces yet"
          description="Add at least one active top, bottom and pair of shoes. Jackets are optional."
          action={
            <Link href="/wardrobe/add">
              <Button>Add clothing</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
