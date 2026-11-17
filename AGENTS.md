# fes-list 项目约定

## 禁止自行构建（最高优先级）

- **不要**自行运行 `eas build` / `eas submit` / `eas build:cancel`。
- EAS 每月有免费额度，每次构建前**必须先问用户**，得到明确同意才执行。
- 修完 bug 不等于要重新构建；不要顺手就 build。
- 不消耗额度、可以自行执行：`npx expo start`、`npx expo start --web`、`npx expo export`、`npx tsc --noEmit`、`npm run lint`、`npx expo-doctor`。

## 技术栈

- Expo SDK 58（expo 58.0.25）+ RN 0.88.1 + React 19.3 + expo-router 58.0.31
- 不要混用 SDK 57/58 的包：之前 `expo-font@58` 配 `expo-modules-core@57` 导致启动时 `dyld: Symbol not found` 闪退
- 数据存储：AsyncStorage（记录）+ IndexedDB（web 图片）/ 文件系统（iOS 图片）
- 同步服务器：`http://47.116.101.152:8080`（Node 零依赖 + systemd，数据在 `/var/lib/fes-sync`，token 在 `/var/lib/fes-sync/token.txt`）

## 改完必跑

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npx expo-doctor`（应为 20/20）
4. 涉及 UI 时用无头浏览器截图自查（`npx expo start --web` + Edge headless）

## 已知坑

- `.npmrc` 写入会被安全策略拦截，别走这条路
- SDK 58 已移除 `newArchEnabled` 字段
- `tabBarIcon` 的 `color` 可能是 null，需要 `as string`
