'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  type Category,
  type Color,
  type Pattern,
  type Style,
  type Temperature,
  type Season,
  type Occasion,
} from '@/types/clothing';
import { upsertClothing, getClothing } from '@/lib/storage/clothingStorage';
import { compressImage } from '@/lib/image';
import { generateOutfits } from '@/engine';
import { saveOutfits, getOutfits } from '@/lib/storage/outfitStorage';
import { Button, Chip } from '@/components/ui';

const multi = <T extends string>(
  values: readonly T[],
  selected: T[],
  set: (x: T[]) => void,
  renderLabel?: (v: T) => React.ReactNode
) => (
  <div className="flex flex-wrap gap-2">
    {values.map((x) => (
      <Chip
        key={x}
        active={selected.includes(x)}
        onClick={() => set(selected.includes(x) ? selected.filter((y) => y !== x) : [...selected, x])}
      >
        {renderLabel ? renderLabel(x) : x.replace('_', ' ')}
      </Chip>
    ))}
  </div>
);

export default function AddClothing() {
  const router = useRouter();
  const [image, setImage] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('T-shirt');
  const [color, setColor] = useState<Color>('black');
  const [secondary, setSecondary] = useState<Color[]>([]);
  const [pattern, setPattern] = useState<Pattern>('solid');
  const [styles, setStyles] = useState<Style[]>(['casual']);
  const [temps, setTemps] = useState<Temperature[]>(['all']);
  const [seasons, setSeasons] = useState<Season[]>(['all']);
  const [occasions, setOccasions] = useState<Occasion[]>(['casual']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!image) return setError('A photo is required.');
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const item = {
        id: crypto.randomUUID(),
        name: name.trim() || category,
        image,
        category,
        color,
        secondaryColors: secondary,
        pattern,
        styles,
        temperatures: temps,
        seasons,
        occasions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      upsertClothing(item);
      saveOutfits(generateOutfits(getClothing(), getOutfits()));
      window.dispatchEvent(new Event('wardrobe:changed'));
      router.push('/wardrobe');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/wardrobe" className="text-sm text-stone-500">
          ← Back to wardrobe
        </Link>
        <p className="mt-7 text-xs uppercase tracking-wider text-stone-400">New piece</p>
        <h1 className="mt-1 text-4xl font-semibold">Add clothing</h1>
        <p className="mt-2 text-sm text-stone-500">
          Describe the piece once. The outfit engine handles the combinations.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-[.85fr_1.15fr]">
        <label className="group flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-stone-300 bg-stone-100">
          {image ? (
            <img src={image} className="h-full w-full object-cover" alt="Preview" />
          ) : (
            <div className="p-6 text-center">
              <div className="mx-auto mb-3 text-3xl">＋</div>
              <p className="font-medium">Add photo</p>
              <p className="mt-1 text-xs text-stone-500">JPG/PNG/WebP · resized locally</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setImage(await compressImage(f));
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not process image.');
              }
            }}
          />
        </label>

        <div className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Navy oxford shirt"
              className="input"
            />
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="input"
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
              value={color}
              onChange={(e) => setColor(e.target.value as Color)}
              className="input"
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
              value={pattern}
              onChange={(e) => setPattern(e.target.value as Pattern)}
              className="input"
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
          {multi(COLORS, secondary, setSecondary, (c) => (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full border border-stone-300"
                style={{ background: COLOR_HEX[c] }}
              />
              {COLOR_LABELS[c]}
            </span>
          ))}
        </Field>
        <Field label="Styles">{multi(STYLES, styles, setStyles)}</Field>
        <Field label="Temperature">{multi(TEMPERATURES, temps, setTemps)}</Field>
        <Field label="Seasons">{multi(SEASONS, seasons, setSeasons)}</Field>
        <Field label="Occasions">{multi(OCCASIONS, occasions, setOccasions)}</Field>
      </section>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end gap-2">
        <Link href="/wardrobe">
          <Button variant="light" type="button">
            Cancel
          </Button>
        </Link>
        <Button disabled={busy}>{busy ? 'Saving…' : 'Save piece'}</Button>
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
