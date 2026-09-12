'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getClothing } from '@/lib/storage/clothingStorage';
import type { Category, ClothingItem, Color } from '@/types/clothing';
import { CATEGORIES, COLORS, COLOR_LABELS, COLOR_HEX } from '@/types/clothing';
import { ClothingCard } from '@/components/ClothingCard';
import { Button, Chip, EmptyState } from '@/components/ui';

export default function Wardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [color, setColor] = useState<Color | 'all'>('all');

  useEffect(() => {
    setItems(getClothing().filter((i) => i.isActive));
  }, []);

  // Collect colors present in current wardrobe for quick chips, plus allow filtering by any color
  const presentColors = useMemo(() => {
    const set = new Set<Color>();
    items.forEach((i) => set.add(i.color));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!query ||
            i.name.toLowerCase().includes(query.toLowerCase()) ||
            i.category.toLowerCase().includes(query.toLowerCase()) ||
            COLOR_LABELS[i.color]?.toLowerCase().includes(query.toLowerCase())) &&
          (category === 'all' || i.category === category) &&
          (color === 'all' || i.color === color)
      ),
    [items, query, category, color]
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400">Digital wardrobe</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Your clothes</h1>
          <p className="mt-2 text-sm text-stone-500">
            {items.length} active pieces · every photo stays on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/settings">
            <Button variant="light">Backup & Restore</Button>
          </Link>
          <Link href="/wardrobe/add">
            <Button>Add clothing</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your wardrobe by name, category, or color…"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-stone-400"
        />

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Category</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={category === 'all'} onClick={() => setCategory('all')}>
              All categories
            </Chip>
            {CATEGORIES.map((x) => (
              <Chip key={x} active={category === x} onClick={() => setCategory(x)}>
                {x}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Color</p>
            {presentColors.length < COLORS.length && (
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as Color | 'all')}
                className="rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-600 outline-none"
              >
                <option value="all">More colors…</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {COLOR_LABELS[c]}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={color === 'all'} onClick={() => setColor('all')}>
              All colors
            </Chip>
            {/* Show present colors as chips first */}
            {presentColors.map((x) => (
              <Chip key={x} active={color === x} onClick={() => setColor(x)}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full border border-stone-300"
                    style={{ background: COLOR_HEX[x] }}
                  />
                  {COLOR_LABELS[x]}
                </span>
              </Chip>
            ))}
            {/* If selected color is not in presentColors, show it as active chip */}
            {color !== 'all' && !presentColors.includes(color) && (
              <Chip active onClick={() => setColor('all')}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full border border-stone-300"
                    style={{ background: COLOR_HEX[color] }}
                  />
                  {COLOR_LABELS[color]}
                </span>
              </Chip>
            )}
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <ClothingCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={items.length ? 'No matching pieces' : 'Nothing in your wardrobe yet'}
          description={
            items.length
              ? 'Try a different search or filter.'
              : 'Add individual pieces with photos and metadata. Wardrobe will use them to generate outfits.'
          }
          action={
            <Link href="/wardrobe/add">
              <Button>Add your first piece</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
