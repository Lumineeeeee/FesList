import { DEFAULT_HALL_ID } from '@/data/halls';

export const OFF_ID = 'OFF';
export const MAP_ID = 'MAP';

export function isSpecial(boothId: string): boolean {
  return boothId === OFF_ID || boothId === MAP_ID;
}

/** 老数据（A05 / B09）补上馆前缀 */
export function migrateBoothId(boothId: string): string {
  if (!boothId) return boothId;
  if (isSpecial(boothId) || boothId.includes(':')) return boothId;
  return `${DEFAULT_HALL_ID}:${boothId}`;
}

export function hallOfBooth(boothId: string): string | null {
  if (isSpecial(boothId)) return null;
  const i = boothId.indexOf(':');
  return i > 0 ? boothId.slice(0, i) : DEFAULT_HALL_ID;
}

/** h1:A05 → A05；OFF 原样 */
export function cellOf(boothId: string): string {
  if (isSpecial(boothId)) return boothId;
  const i = boothId.indexOf(':');
  return i >= 0 ? boothId.slice(i + 1) : boothId;
}

export function boothKey(hallId: string, cell: string): string {
  return `${hallId}:${cell}`;
}
