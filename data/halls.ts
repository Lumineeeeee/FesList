import { BOOTHS } from '@/data/booths';

export type Hall = {
  id: string;
  name: string;
  /** 行的字母，比如 ['A','B','C','D'] */
  rows: string[];
  /** 每行几列 */
  cols: number;
  /** 摊位名，key 是格号（A01），没有就是空 */
  booths: Record<string, string>;
};

export const DEFAULT_HALL_ID = 'h1';

export function cellId(row: string, col: number): string {
  return `${row}${String(col).padStart(2, '0')}`;
}

/** 默认馆：沿用官方那张 4 号馆摊位表 */
export function defaultHalls(): Hall[] {
  const booths: Record<string, string> = {};
  for (const b of BOOTHS) booths[b.id] = b.name;
  return [
    {
      id: DEFAULT_HALL_ID,
      name: '4 号馆',
      rows: ['A', 'B', 'C', 'D'],
      cols: 9,
      booths,
    },
  ];
}

export function hallCells(hall: Hall): string[] {
  const out: string[] = [];
  for (const row of hall.rows) {
    for (let c = 1; c <= hall.cols; c += 1) out.push(cellId(row, c));
  }
  return out;
}

/** 排布签名：用来判断两份数据是不是同一套排布 */
export function hallSignature(halls: Hall[]): string {
  return halls
    .map((h) => `${h.id}|${h.name}|${h.rows.join('')}|${h.cols}`)
    .sort()
    .join(';');
}
