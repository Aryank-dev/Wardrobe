import type { Outfit } from '@/types/outfit';
import { read, write } from './storage';
const KEY='outfits';
export const getOutfits=()=>read<Outfit[]>(KEY,[]);
export const saveOutfits=(items:Outfit[])=>write(KEY,items);
export function updateOutfit(outfit:Outfit){ saveOutfits(getOutfits().map(x=>x.id===outfit.id?outfit:x)); }
