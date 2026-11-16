# FES 逛展清单

杭州 FES 2026（11.27–11.29，4 号馆同人区）的个人逛展清单 App。
一个「地图」Tab 看摊位，一个「清单」Tab 看买什么、买了没有。

Expo + React Native，**一份代码同时出 iOS 和 Web**。iOS 用手机上的 Expo Go 真机跑，Web 用浏览器跑，改代码两边同时热更新。

## 跑起来

### Web（最快的开发预览）

```powershell
cd D:\Feser_\fes-list
npm install
npx expo start --web
```

浏览器自动打开，改 `app/` 或 `components/` 下的文件就热更新。

### iOS 实机

```powershell
cd D:\Feser_\fes-list
npx expo start --tunnel
```

手机装 App Store 版 Expo Go（需支持 SDK 57），扫终端里的二维码。

不要跑 `npm run ios` —— 那需要 Mac 和 Xcode。

## 检查

```powershell
npx tsc --noEmit            # 类型
npm run lint                # ESLint
npx expo export --platform ios    # 验证 iOS 包能打出来
npx expo export --platform web    # 验证 Web 包能打出来
```

三个都过了。

## 结构

```
app/
  _layout.tsx          根 Stack + 数据 Provider
  (tabs)/
    _layout.tsx        底部两个 Tab（地图 / 清单）
    index.tsx          地图：A/B/C/D × 01–09 摊位示意 + 要去列表
    list.tsx           清单：按摊位分组、全部/未买/已买筛选、勾选、长按删除
  booth/[id].tsx       摊位详情（弹层）：加要买的东西、勾掉
components/BoothMap.tsx   摊位网格，格子大小按容器宽度算
components/PromoViewer.tsx  摊宣全屏查看（双指放大）
data/booths.ts         36 个摊位（来自官方「4号馆同人区摊位详情」）
data/items.ts          初始清单（目前为空，等腾讯文档的清单）
data/promo.ts          摊位号 → 摊宣图，由 npm run gen:promo 生成
assets/promo/          摊宣图放这里，文件名 = 摊位号
store/shopping.tsx     清单状态 + AsyncStorage 本地持久化
scripts/gen-promo.mjs  扫描 assets/promo/ 生成 data/promo.ts
scripts/serve_static.py   本地静态预览服务器（把 /list 映射到 list.html）
```

## 摊宣图怎么加

1. 把图放进 `assets/promo/`，**文件名就是摊位号**：`A05.jpg`、`D07.png`（png/jpg/jpeg/webp 都行）。
2. 跑 `npm run gen:promo`。
3. 重开 App —— 摊位详情页顶部就会出现「摊宣」，点一下全屏，可以双指放大。

React Native 的 `require` 不能拼路径，所以必须靠这个脚本把文件名写进代码里。没有图的摊位会显示一个虚线占位框，不影响其他功能。

## 数据怎么改

- **摊位名**：`data/booths.ts` 的 `RAW`，一行一个 `['A', 1, '万物皆可']`。
- **初始清单**：`data/items.ts` 的 `SEED_ITEMS`：

  ```ts
  {
    id: 'b09-free',
    boothId: 'B09',
    title: 'A4 海报（[抓娃娃]）',
    price: '无料',            // 有价就写 '¥45'
    note: '关注任意平台可领 1',  // 可选，显示在标题下面
    done: false,
  }
  ```

  注意：App 在手机上存过数据后以本地为准。改完种子数据要重装 App 或清缓存才看得到。

## 交互

- 地图点摊位 → 弹层里加「要买什么」；加过的摊位变黄，全部勾完变黑。
- 地图下方「要去」横条：点一下直接进那个摊位。
- 清单里点一行勾选，长按删除。
- 数据存在本地（AsyncStorage），换设备不同步。

## 已知边界

- 摊位位置是按官方「同人区摊位分布」的 A/B/C/D × 01–09 网格还原的**示意图**，不是场地图纸。
- 5 号馆 / 6 号馆（官方周边贩售区）还没做，因为只有区域分布、没有摊位明细。
- 摊位名有 3–4 个是从官方图里 OCR 的，可能有个别字不准，见 `data/booths.ts`。
