// 由 scripts/gen-promo.mjs 生成，不要手改。
// 图片放 assets/promo/，文件名 = 摊位号（A05.jpg），多张用 B02-2.png，然后 npm run gen:promo。
import type { ImageSourcePropType } from 'react-native';

export const PROMO: Record<string, ImageSourcePropType[]> = {
  'A05': [
    require('../assets/promo/A05.png'),
  ],
  'B02': [
    require('../assets/promo/B02.png'),
    require('../assets/promo/B02-2.png'),
  ],
  'B03': [
    require('../assets/promo/B03.jpg'),
  ],
  'B05': [
    require('../assets/promo/B05.png'),
  ],
  'B09': [
    require('../assets/promo/B09.png'),
  ],
  'C09': [
    require('../assets/promo/C09.png'),
    require('../assets/promo/C09-2.png'),
    require('../assets/promo/C09-3.png'),
    require('../assets/promo/C09-4.png'),
  ],
  'MAP': [
    require('../assets/promo/MAP.jpg'),
    require('../assets/promo/MAP-2.jpg'),
    require('../assets/promo/MAP-3.jpg'),
    require('../assets/promo/MAP-4.jpg'),
  ],
  'OFF': [
    require('../assets/promo/OFF.jpg'),
    require('../assets/promo/OFF-2.jpg'),
  ],
};
