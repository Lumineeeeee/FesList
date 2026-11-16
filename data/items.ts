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
export const SEED_ITEMS: BuyItem[] = [
  {
    id: 'b09-free',
    boothId: 'B09',
    title: 'A4 海报（[抓娃娃]）',
    price: '无料',
    note: '关注任意平台可领 1',
    done: false,
  },
  {
    id: 'b02-free',
    boothId: 'B02',
    title: '小天使口罩',
    price: '无料',
    note: '现场出示 fans 证明',
    done: false,
  },
  {
    id: 'b02-bookmark',
    boothId: 'B02',
    title: '菲欧妮异形书签',
    price: '¥8',
    done: false,
  },
  {
    id: 'b05-free',
    boothId: 'B05',
    title: '触感膜对裱小卡一对',
    price: '无料',
    note: '关注 @五万五 + 点赞收藏摊宣',
    done: false,
  },
  {
    id: 'a05-postcard',
    boothId: 'A05',
    title: '林德薇恩线稿明信片 / 拍立得',
    note: '摊宣未标价',
    done: false,
  },
  {
    id: 'b03-standee',
    boothId: 'B03',
    title: '蕾米立牌（幻彩膜亚克力）',
    price: '¥35',
    done: false,
  },
  {
    id: 'c09-painting',
    boothId: 'C09',
    title: '薇薇安挂画',
    price: '¥45',
    done: false,
  },
  {
    id: 'c09-sticker',
    boothId: 'C09',
    title: '妄想天使贴纸包（PET+转印）',
    note: '摊宣未标价',
    done: false,
  },
  {
    id: 'c09-polaroid',
    boothId: 'C09',
    title: '烫金拍立得',
    note: '摊宣未标价',
    done: false,
  },
  {
    id: 'c09-postcard',
    boothId: 'C09',
    title: '场限明信片《妄想夏日》',
    note: '微喷蚂蚁线 · 摊宣未标价',
    done: false,
  },
];
