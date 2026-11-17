# FesList · 漫展逛摊清单

一个人用的漫展工具：把官方摊位表变成可点的网格，记下每个摊位要买什么、花了多少钱，摊宣图、场地图、摊位链接都放在一起。

数据**全部保存在本机**，不联网、不注册、不上传。换设备靠导入导出。

## 下载

- **Android APK** → [Releases](../../releases) 页面下载 `FesList-android.apk`
- **Web 版**（本地跑，无需安装）→ [Releases](../../releases) 下载 `FesList-web.zip`

> Web 版解压后是纯静态文件，因为浏览器限制，**直接双击 `index.html` 打不开**，需要在解压目录里起一个本地服务：
>
> ```bash
> python -m http.server 8080
> ```
> 然后浏览器打开 http://localhost:8080
>
> （首次打开后数据存在浏览器的 IndexedDB 里，清缓存会丢，重要数据记得导出。）

iOS 版走 TestFlight，暂不公开分发。

## 功能

- **同人**：按馆切换，A–D × 1–9 的摊位网格；有要买的摊位变黄，买完变黑
- **官方**：官方周边的图、链接、清单
- **地图**：场地图可上传多张，指定哪张优先展示
- **清单**：按摊位分组，三级优先级（优先排 / 有点心动 / 随便看看），金额统计（无料与未标价不计）
- **链接**：每个摊位可挂多个信息链接，点一下用浏览器打开
- **多漫展**：可新建多个漫展，数据互相独立
- **导入导出**：每场漫展一份 `信息.zip`（图 + 排布 + 链接）和一份 `清单.json`，导入支持覆盖或融合

## 本地开发

```bash
npm install
npx expo start --web      # 浏览器
npx expo start --tunnel   # 手机上用 Expo Go 扫码
```

## 构建

```bash
npx eas build -p android --profile preview-apk    # APK
npx expo export --platform web                    # 静态网页，产物在 dist/
```

## 技术栈

Expo SDK 58 · React Native 0.88 · expo-router · TypeScript
数据层：AsyncStorage（记录）+ IndexedDB / 文件系统（图片）
