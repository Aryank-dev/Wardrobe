import type { WearHistoryRecord } from '@/types/history';
import { read, write } from './storage';
const KEY='wear-history';
export const getWearHistory=()=>read<WearHistoryRecord[]>(KEY,[]);
export const saveWearHistory=(items:WearHistoryRecord[])=>write(KEY,items);
export function addWearHistory(outfitId:string){ const record:WearHistoryRecord={id:crypto.randomUUID(),outfitId,wornAt:new Date().toISOString()}; saveWearHistory([record,...getWearHistory()]); return record; }
