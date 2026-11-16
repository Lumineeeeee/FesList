/** 从「¥45」「45」「无料」「¥1,280」里取出金额；无料和没标价返回 null */
export function priceValue(price?: string): number | null {
  if (!price) return null;
  if (price.includes('无料')) return null;
  const cleaned = price.replace(/[,，\s]/g, '');
  const m = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `¥${rounded.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

export function moneyStats(items: { price?: string; done: boolean }[]) {
  let planned = 0;
  let spent = 0;
  for (const it of items) {
    const v = priceValue(it.price);
    if (v === null) continue;
    planned += v;
    if (it.done) spent += v;
  }
  return { planned, spent, left: planned - spent };
}
