import { PRIORITY_ORDER, type BuyItem, type Priority } from '@/data/items';

const RANK: Record<Priority, number> = { high: 0, mid: 1, low: 2 };

export function rankOf(priority?: Priority): number {
  return RANK[priority ?? 'mid'];
}

export function nextPriority(priority?: Priority): Priority {
  const current = priority ?? 'mid';
  const i = PRIORITY_ORDER.indexOf(current);
  return PRIORITY_ORDER[(i + 1) % PRIORITY_ORDER.length];
}

/** 按优先级，同级按字母/编号 */
export function sortByPriority<T extends { priority?: Priority }>(
  list: T[],
  tieBreak: (item: T) => string,
): T[] {
  return [...list].sort((a, b) => {
    const d = rankOf(a.priority) - rankOf(b.priority);
    if (d !== 0) return d;
    return tieBreak(a).localeCompare(tieBreak(b), 'zh-Hans-CN');
  });
}

/** 一个摊位里最靠前的优先级，用来给摊位排序 */
export function boothRank(boothId: string, items: BuyItem[]): number {
  const ranks = items.filter((i) => i.boothId === boothId).map((i) => rankOf(i.priority));
  return ranks.length ? Math.min(...ranks) : PRIORITY_ORDER.length;
}
