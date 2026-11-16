import { Asset } from 'expo-asset';

import { PROMO } from '@/data/promo';

export type SeedRecord = {
  id: string;
  boothId: string;
  title: string;
  primary?: boolean;
  imageKey: string;
  createdAt: number;
};

/** 内置地图的名字，顺序要和 assets/promo 里 MAP*.jpg 的序号一致 */
export const SEED_MAP_TITLES = ['场馆位置', '4 号馆', '5 号馆', '6 号馆'];
export const DEFAULT_PRIMARY_MAP = '4 号馆';

/**
 * 把打包进 App 的内置摊宣，转成「数据库记录」的初始数据。
 * 只在首次启动时写入一次，之后和用户上传的图一视同仁：能换、能删。
 */
export async function buildPromoSeed(): Promise<SeedRecord[]> {
  const now = Date.now();
  const out: SeedRecord[] = [];

  for (const boothId of Object.keys(PROMO).sort()) {
    const list = PROMO[boothId] ?? [];
    for (let i = 0; i < list.length; i += 1) {
      const source = list[i];
      try {
        // 原生是数字（模块 id），Web 上直接是 { uri } 对象
        let uri: string | null = null;
        if (typeof source === 'number') {
          const asset = Asset.fromModule(source);
          if (!asset.downloaded) await asset.downloadAsync();
          uri = asset.localUri ?? asset.uri;
        } else if (source && typeof source === 'object' && 'uri' in source) {
          uri = (source as { uri: string }).uri;
        }
        if (!uri) continue;

        const isMap = boothId === 'MAP';
        const title = isMap ? (SEED_MAP_TITLES[i] ?? `地图 ${i + 1}`) : '';

        out.push({
          id: `seed-${boothId}-${i + 1}`,
          boothId,
          title,
          primary: isMap ? title === DEFAULT_PRIMARY_MAP : undefined,
          imageKey: uri,
          createdAt: now + i,
        });
      } catch {
        // 单张拿不到就跳过，不影响其他
      }
    }
  }

  return out;
}
