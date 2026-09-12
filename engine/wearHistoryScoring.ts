import type { Outfit } from '@/types/outfit';
export function wearHistoryScore(outfit:Pick<Outfit,'lastWornAt'|'timesWorn'>):number { if(!outfit.lastWornAt) return 100; const days=(Date.now()-new Date(outfit.lastWornAt).getTime())/86400000; const recencyPenalty=days<1?55:days<3?35:days<7?20:days<14?10:0; return Math.max(25,100-recencyPenalty-Math.min(10,outfit.timesWorn)); }
