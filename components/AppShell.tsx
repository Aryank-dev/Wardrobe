'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getClothing } from '@/lib/storage/clothingStorage';
import { getOutfits } from '@/lib/storage/outfitStorage';

const nav = [
  ['/', 'Dashboard'],
  ['/wardrobe', 'Wardrobe'],
  ['/outfits', 'Outfits'],
  ['/recommendations', 'Recommendations'],
  ['/history', 'History'],
  ['/settings', 'Settings'],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [counts, setCounts] = useState({ items: 0, outfits: 0 });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const refresh = () =>
      setCounts({
        items: getClothing().filter((x) => x.isActive).length,
        outfits: getOutfits().length,
      });
    refresh();
    window.addEventListener('wardrobe:changed', refresh);
    return () => window.removeEventListener('wardrobe:changed', refresh);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Wardrobe<span className="text-stone-400">.</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {nav.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  path === href
                    ? 'bg-zinc-900 text-white'
                    : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 text-xs text-stone-500 sm:flex">
            <span>{counts.items} pieces</span>
            <span className="h-1 w-1 rounded-full bg-stone-300" />
            <span>{counts.outfits} looks</span>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-stone-200/70 px-4 py-2 md:hidden">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                path === href ? 'bg-zinc-900 text-white' : 'text-stone-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
