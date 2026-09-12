'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getClothing } from '@/lib/storage/clothingStorage';
import { getOutfits, saveOutfits } from '@/lib/storage/outfitStorage';
import { addWearHistory } from '@/lib/storage/historyStorage';
import { generateOutfits, generateSingleCombination } from '@/engine';
import type { ClothingItem, Occasion, Season, Temperature } from '@/types/clothing';
import type { Outfit } from '@/types/outfit';
import { OutfitFilters } from '@/components/filters';
import { OutfitCard } from '@/components/OutfitCard';
import { Button, EmptyState } from '@/components/ui';

export default function Recommendations() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [occasion, setOccasion] = useState<'all' | Occasion>('all');
  const [temperature, setTemperature] = useState<Temperature | 'all'>('all');
  const [season, setSeason] = useState<Season | 'all'>('all');

  // Regenerate feature states
  const [spotlightOutfit, setSpotlightOutfit] = useState<Outfit | null>(null);
  const [recentGeneratedIds, setRecentGeneratedIds] = useState<string[]>([]);
  const [regenerateMessage, setRegenerateMessage] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

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

  const matching = useMemo(
    () =>
      outfits
        .filter(
          (o) =>
            (occasion === 'all' || o.occasions.includes(occasion)) &&
            (temperature === 'all' || o.score.temperature >= 60) &&
            (season === 'all' || o.score.season >= 60)
        )
        .sort((a, b) => b.score.total - a.score.total),
    [outfits, occasion, temperature, season]
  );

  function worn(o: Outfit) {
    const next = outfits.map((x) =>
      x.id === o.id
        ? { ...x, timesWorn: x.timesWorn + 1, lastWornAt: new Date().toISOString() }
        : x
    );
    if (!next.some((x) => x.id === o.id)) {
      next.unshift({
        ...o,
        timesWorn: o.timesWorn + 1,
        lastWornAt: new Date().toISOString(),
      });
    }
    addWearHistory(o.id);
    const regenerated = generateOutfits(items, next);
    saveOutfits(regenerated);
    setOutfits(regenerated);
    if (spotlightOutfit?.id === o.id) {
      setSpotlightOutfit({
        ...o,
        timesWorn: o.timesWorn + 1,
        lastWornAt: new Date().toISOString(),
      });
    }
    window.dispatchEvent(new Event('wardrobe:changed'));
  }

  const handleRegenerate = () => {
    setRegenerateMessage(null);
    setSavedToast(null);

    const context: {
      occasion?: Occasion;
      temperature?: Temperature;
      season?: Season;
    } = {};

    if (occasion !== 'all') context.occasion = occasion;
    if (temperature !== 'all') context.temperature = temperature;
    if (season !== 'all') context.season = season;

    const result = generateSingleCombination({
      items,
      currentOutfitId: spotlightOutfit?.id,
      context,
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
    setSavedToast('Outfit saved to your looks!');
    setTimeout(() => setSavedToast(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header with Regenerate Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400">Smart recommendations</p>
          <h1 className="mt-1 text-4xl font-semibold">What should you wear?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Filters narrow the saved outfit library. Rankings favor color harmony, style, occasion fit, weather context, and your custom preferences.
          </p>
        </div>

        <Button onClick={handleRegenerate} className="flex items-center gap-1.5 sm:self-auto self-start">
          <span>✨</span>
          <span>Generate New Combination</span>
        </Button>
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
      {savedToast && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span>✓ {savedToast}</span>
          <button onClick={() => setSavedToast(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Freshly Generated Recommendation Spotlight */}
      {spotlightOutfit && (
        <section className="animate-fade-in rounded-3xl border-2 border-zinc-900 bg-stone-50/80 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                  ✨ Generated Look
                </span>
                {spotlightOutfit.score.customBonus && spotlightOutfit.score.customBonus > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                    +{spotlightOutfit.score.customBonus} Custom Preference Match
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Tailored combination matching your selected filters and fashion compatibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="light" onClick={handleRegenerate}>
                Generate Another →
              </Button>
              <Button onClick={handleSaveSpotlightOutfit}>
                Save Outfit
              </Button>
            </div>
          </div>

          <div className="max-w-md">
            <OutfitCard outfit={spotlightOutfit} items={items} onWorn={worn} />
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5">
        <OutfitFilters
          occasion={occasion}
          temperature={temperature}
          season={season}
          setOccasion={setOccasion}
          setTemperature={setTemperature}
          setSeason={setSeason}
        />
      </section>

      {/* Matching list */}
      {matching.length ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">{matching.length} matching looks</p>
            <p className="text-xs text-stone-400">Highest score first</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {matching.map((o) => (
              <OutfitCard key={o.id} outfit={o} items={items} onWorn={worn} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No recommendations match those filters"
          description="Try broadening one filter, or click 'Generate New Combination' above to evaluate fresh combinations from your wardrobe."
          action={
            <Button onClick={handleRegenerate}>Generate Combination</Button>
          }
        />
      )}
    </div>
  );
}
