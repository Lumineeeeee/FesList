export type BoothRow = 'A' | 'B' | 'C' | 'D';

export type Booth = {
  /** 摊位号，例如 A01 */
  id: string;
  row: BoothRow;
  /** 排内序号 1-9 */
  col: number;
  /** 摊位名 */
  name: string;
};

type RawRow = [BoothRow, number, string];

const RAW: RawRow[] = [
  ['A', 1, '万谷丰登'],
  ['A', 2, '甲板下的鸽子窝'],
  ['A', 3, '四色绮想&淬火红茶馆'],
  ['A', 4, '叽叽万薯八重奏'],
  ['A', 5, 'AAA萌妹批发中心'],
  ['A', 6, '猫猫头工作室'],
  ['A', 7, '三分甜麦麦薯饼'],
  ['A', 8, '严选茶×摩卡北北'],
  ['A', 9, '是悠咪的漫长假期'],

  ['B', 1, '空巡局'],
  ['B', 2, '转学生背后身份竟是！'],
  ['B', 3, '绳网精选'],
  ['B', 4, '猫毛过敏中心'],
  ['B', 5, '大狗嚼嚼嚼'],
  ['B', 6, 'Level 咖啡厅'],
  ['B', 7, '旅涂剧社'],
  ['B', 8, '反应过来已是豪饮'],
  ['B', 9, '徐萌萌'],

  ['C', 1, '鱼爸的养生鱼塘'],
  ['C', 2, '猫狗douline&可爱公馆'],
  ['C', 3, '蔷薇石英'],
  ['C', 4, '今天中午吃什么'],
  ['C', 5, '娃娃菜特供粥铺'],
  ['C', 6, 'AA贝果专业空洞拾遗'],
  ['C', 7, '一生的请求'],
  ['C', 8, '异世界狂欢'],
  ['C', 9, '午起的鸟儿摆打撒'],

  ['D', 1, '原汁云蜜×喵游星辰'],
  ['D', 2, '那个S什么N的'],
  ['D', 3, '海棠韭号'],
  ['D', 4, '心跳第七次'],
  ['D', 5, '寰宇诺亚的小摊儿'],
  ['D', 6, 'ONANA Robotics'],
  ['D', 7, '新艾莉都小猫批发商'],
  ['D', 8, '哈米伦&中天无限公司'],
  ['D', 9, '邦布帮&KKOMDA'],
];

export const BOOTHS: Booth[] = RAW.map(([row, col, name]) => ({
  id: `${row}${String(col).padStart(2, '0')}`,
  row,
  col,
  name,
}));

/** 官方周边贩售区：不在 A–D 网格里，单独一个「摊位」。 */
export const OFFICIAL_BOOTH: Booth = {
  id: 'OFF',
  row: 'A',
  col: 0,
  name: '官方周边贩售区',
};

/** 场馆地图：同样当成一个「摊位」来挂图片。 */
export const MAP_BOOTH: Booth = {
  id: 'MAP',
  row: 'A',
  col: 0,
  name: '场馆地图',
};

export const BOOTH_BY_ID = new Map<string, Booth>([
  ...BOOTHS.map((b) => [b.id, b] as const),
  ['OFF', OFFICIAL_BOOTH],
  ['MAP', MAP_BOOTH],
]);

export const ROWS: BoothRow[] = ['A', 'B', 'C', 'D'];

export const EVENT = {
  name: 'FES 2026',
  hall: '4 号馆 · 同人区',
  dates: '11.27 – 11.29',
  city: '杭州大会展中心',
};
