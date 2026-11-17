export type Priority = 'high' | 'mid' | 'low';

export const PRIORITY_META: Record<Priority, { label: string; fg: string; bg: string }> = {
  high: { label: '优先排', fg: '#B3261E', bg: '#FBE3DF' },
  mid: { label: '有点心动', fg: '#8A7413', bg: '#FBF2C0' },
  low: { label: '随便看看', fg: '#6E6A5E', bg: '#EDEAE0' },
};

export const PRIORITY_ORDER: Priority[] = ['high', 'mid', 'low'];

export type BuyItem = {
  id: string;
  /** 属于哪一场漫展 */
  eventId?: string;
  boothId: string;
  title: string;
  done: boolean;
  /** 价格。无料写「无料」，有价写「¥45」，没标价就留空。 */
  price?: string;
  /** 补充说明，显示在标题下面。 */
  note?: string;
  /** 优先级，默认「有点心动」 */
  priority?: Priority;
};

/**
 * 初始清单。运行中新增/勾选的内容会存在手机本地，以本地为准。
 */
export const SEED_ITEMS: BuyItem[] = [];
