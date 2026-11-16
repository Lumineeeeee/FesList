import { BOOTH_BY_ID } from '@/data/booths';

/** 摊位号：A01–D09 或 OFF，大小写都认，缺位补零 */
export function normalizeBooth(raw: string): string | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!v) return null;
  if (v === 'OFF' || v === '官方' || v === 'OFFICIAL') return 'OFF';
  if (v === 'MAP' || v === '地图') return 'MAP';
  const m = v.match(/^([A-D])(\d{1,2})$/);
  if (!m) return null;
  const id = `${m[1]}${m[2].padStart(2, '0')}`;
  return BOOTH_BY_ID.has(id) ? id : null;
}

/** 价格：只填数字自动加 ¥；「无料」这类原样保留；空就是没价 */
export function normalizePrice(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (/^\d+(\.\d+)?$/.test(v)) return `¥${v}`;
  if (/^[¥￥]\s*\d+(\.\d+)?$/.test(v)) return `¥${v.replace(/[¥￥\s]/g, '')}`;
  return v;
}
