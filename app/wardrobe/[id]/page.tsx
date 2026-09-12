'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getClothing,
  upsertClothing,
  deactivateClothing,
} from '@/lib/storage/clothingStorage';
import { getOutfits, saveOutfits } from '@/lib/storage/outfitStorage';
import { generateOutfits } from '@/engine';
import { compressImage } from '@/lib/image';
import {
  CATEGORIES,
  COLORS,
  COLOR_GROUPS,
  COLOR_GROUP_LABELS,
  COLOR_LABELS,
  COLOR_HEX,
  PATTERNS,
  STYLES,
  TEMPERATURES,
  SEASONS,
  OCCASIONS,
  type ClothingItem,
  type Category,
  type Color,
  type Pattern,
  type Style,
  type Temperature,
  type Season,
  type Occasion,
} from '@/types/clothing';
import { Button, Chip } from '@/components/ui';

export default function EditClothing({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState('');
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
      setItem(getClothing().find((x) => x.id === id) ?? null);
    });
  }, [params]);

  if (!item) {
    return (
      <div className="py-20 text-center text-stone-500">
        {id ? 'Piece not found.' : 'Loading…'}
      </div>
    );
  }

  const set = (patch: Partial<ClothingItem>) => setItem((prev) => (prev ? { ...prev, ...patch } : null));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    try {
      const next: ClothingItem = { ...item, updatedAt: new Date().toISOString() };
      upsertClothing(next);
      saveOutfits(generateOutfits(getClothing(), getOutfits()));
      window.dispatchEvent(new Event('wardrobe:changed'));
      router.push('/wardrobe');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  function deactivate() {
    if (!item) return;
    deactivateClothing(item.id);
    saveOutfits(generateOutfits(getClothing(), getOutfits()));
    window.dispatchEvent(new Event('wardrobe:changed'));
    router.push('/wardrobe');
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/wardrobe" className="text-sm text-stone-500">
          ← Back to wardrobe
        </Link>
        <h1 className="mt-7 text-4xl font-semibold">Edit piece</h1>
      </div>

      <section className="grid gap-5 md:grid-cols-[.85fr_1.15fr]">
        <label className="group flex aspect-[4/5] cursor-pointer overflow-hidden rounded-3xl border border-stone-200 bg-stone-100">
          <img src={item.image} className="h-full w-full object-cover" alt={item.name} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                try {
                  const compressed = await compressImage(f);
                  set({ image: compressed });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not process image.');
                }
              }
            }}
          />
        </label>

        <div className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5">
          <Field label="Name">
            <input
              className="input"
              value={item.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <select
              className="input"
              value={item.category}
              onChange={(e) => set({ category: e.target.value as Category })}
            >
              {CATEGORIES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Primary color">
            <select
              className="input"
              value={item.color}
              onChange={(e) => set({ color: e.target.value as Color })}
            >
              {(Object.keys(COLOR_GROUPS) as (keyof typeof COLOR_GROUPS)[]).map((grp) => (
                <optgroup key={grp} label={COLOR_GROUP_LABELS[grp]}>
                  {COLOR_GROUPS[grp].map((c) => (
                    <option key={c} value={c}>
                      {COLOR_LABELS[c]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Pattern">
            <select
              className="input"
              value={item.pattern}
              onChange={(e) => set({ pattern: e.target.value as Pattern })}
            >
              {PATTERNS.map((x) => (
                <option key={x} value={x}>
                  {x.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-stone-200 bg-white p-5">
        <Field label="Secondary colors">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <Chip
                key={c}
                active={item.secondaryColors.includes(c)}
                onClick={() => {
                  const updated = item.secondaryColors.includes(c)
                    ? item.secondaryColors.filter((x) => x !== c)
                    : [...item.secondaryColors, c];
                  set({ secondaryColors: updated });
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full border border-stone-300"
                    style={{ background: COLOR_HEX[c] }}
                  />
                  {COLOR_LABELS[c]}
                </span>
              </Chip>
            ))}
          </div>
        </Field>
        <Multi
          label="Styles"
          values={STYLES}
          selected={item.styles}
          set={(v) => set({ styles: v as Style[] })}
        />
        <Multi
          label="Temperature"
          values={TEMPERATURES}
          selected={item.temperatures}
          set={(v) => set({ temperatures: v as Temperature[] })}
        />
        <Multi
          label="Seasons"
          values={SEASONS}
          selected={item.seasons}
          set={(v) => set({ seasons: v as Season[] })}
        />
        <Multi
          label="Occasions"
          values={OCCASIONS}
          selected={item.occasions}
          set={(v) => set({ occasions: v as Occasion[] })}
        />
      </section>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="danger" onClick={deactivate}>
          Deactivate piece
        </Button>
        <div className="flex gap-2">
          <Link href="/wardrobe">
            <Button variant="light" type="button">
              Cancel
            </Button>
          </Link>
          <Button>Save changes</Button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function Multi<T extends string>({
  label,
  values,
  selected,
  set,
}: {
  label: string;
  values: readonly T[];
  selected: T[];
  set: (v: T[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <Chip
            key={v}
            active={selected.includes(v)}
            onClick={() => set(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])}
          >
            {v.replace('_', ' ')}
          </Chip>
        ))}
      </div>
    </Field>
  );
}
