import type { ClothingItem, Temperature } from '@/types/clothing';
export function temperatureCompatibility(items:ClothingItem[], target?:Temperature):number { if(!target||target==='all') return 82; const matches=items.filter(i=>i.temperatures.includes(target)||i.temperatures.includes('all')).length; return Math.round(45+(matches/items.length)*55); }
