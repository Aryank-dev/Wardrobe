import type { ClothingItem } from '@/types/clothing';
import { read, write } from './storage';
const KEY='clothing';
export const getClothing=()=>read<ClothingItem[]>(KEY,[]);
export const saveClothing=(items:ClothingItem[])=>write(KEY,items);
export function updateClothing(item:ClothingItem){ const all=getClothing(); saveClothing(all.map(x=>x.id===item.id?item:x)); }
export function deactivateClothing(id:string){ const all=getClothing(); saveClothing(all.map(x=>x.id===id?{...x,isActive:false,updatedAt:new Date().toISOString()}:x)); }
export function upsertClothing(item:ClothingItem){ const all=getClothing(); saveClothing(all.some(x=>x.id===item.id)?all.map(x=>x.id===item.id?item:x):[item,...all]); }
