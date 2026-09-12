import type { ClothingItem, Season } from '@/types/clothing';
export function seasonCompatibility(items:ClothingItem[], target?:Season):number { if(!target||target==='all') return 82; const matches=items.filter(i=>i.seasons.includes(target)||i.seasons.includes('all')).length; return Math.round(45+(matches/items.length)*55); }
