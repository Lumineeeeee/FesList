import { DEFAULT_HALL_ID, cellId } from '@/data/halls';
import { cellOf, hallOfBooth } from '@/lib/boothId';

/** 摊位号：A01–D09 / OFF / MAP，大小写都认，缺位补零；返回带馆前缀的 key */
export function normalizeBooth(raw: string, hallId: string = DEFAULT_HALL_ID): string | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!v) return null;
  if (v === 'OFF' || v === '官方' || v === 'OFFICIAL') return 'OFF';
  if (v === 'MAP' || v === '地图') return 'MAP';

  const m = v.match(/^([A-F])(\d{1,2})$/);
  if (!m) return null;
  const id = cellId(m[1], Number(m[2]));
  return `${hallId}:${id}`;
}

/** 只取格号部分，用于输入框回显 */
export function cellInputOf(boothId: string): string {
  return cellOf(boothId);
}

export function hallOf(boothId: string): string {
  return hallOfBooth(boothId) ?? DEFAULT_HALL_ID;
}

/** 价格：只填数字自动加 ¥；「无料」这类原样保留；空就是没价 */
export function normalizePrice(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^\d+(\.\d+)?$/.test(v)) return `¥${v}`;
  if (/^[¥￥]\s*\d+(\.\d+)?$/.test(v)) return `¥${v.replace(/[¥￥\s]/g, '')}`;
  return v;
}
