/** 不同地方的图片叫法不一样：同人摊是「摊宣」，官方是「情报」，地图页就是「地图」 */
export type PromoNoun = {
  /** 单张：摊宣图 / 情报图 / 地图 */
  one: string;
  /** 区块名：摊宣 / 周边情报 / 地图 */
  section: string;
};

export function promoNoun(boothId?: string | null): PromoNoun {
  if (boothId === 'MAP') return { one: '地图', section: '地图' };
  if (boothId === 'OFF') return { one: '情报图', section: '周边情报' };
  return { one: '摊宣图', section: '摊宣' };
}
