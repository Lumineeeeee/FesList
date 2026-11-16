/**
 * 扫描 assets/promo/ 下的图片，生成 data/promo.ts。
 *
 * 命名规则：摊位号 + 可选序号，序号用 -2 / -3 表示同一摊位的第 2、3 张。
 *   A05.jpg      → A05 的第 1 张
 *   B02-2.png    → B02 的第 2 张
 *
 * 用法：把图放进 assets/promo/，然后 `npm run gen:promo`。
 * React Native 的 require 必须是字面量，所以必须先生成。
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'assets', 'promo');
const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);

let files = [];
try {
  files = readdirSync(dir).filter((f) => exts.has(extname(f).toLowerCase()));
} catch {
  files = [];
}

const groups = new Map();
for (const f of files) {
  const base = f.slice(0, -extname(f).length);
  const m = base.match(/^([A-D]\d{2}|OFF|MAP)(?:-(\d+))?$/);
  if (!m) {
    console.warn(`跳过（文件名不符合 A05 / B02-2 规则）: ${f}`);
    continue;
  }
  const id = m[1];
  const idx = m[2] ? Number(m[2]) : 1;
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push({ idx, f });
}

const ids = [...groups.keys()].sort();
const body = ids
  .map((id) => {
    const list = groups.get(id).sort((a, b) => a.idx - b.idx);
    const reqs = list.map((x) => `    require('../assets/promo/${x.f}'),`).join('\n');
    return `  '${id}': [\n${reqs}\n  ],`;
  })
  .join('\n');

const out = `// 由 scripts/gen-promo.mjs 生成，不要手改。
// 图片放 assets/promo/，文件名 = 摊位号（A05.jpg），多张用 B02-2.png，然后 npm run gen:promo。
import type { ImageSourcePropType } from 'react-native';

export const PROMO: Record<string, ImageSourcePropType[]> = {
${body}
};
`;

writeFileSync(join(root, 'data', 'promo.ts'), out, 'utf8');
console.log(`gen:promo -> ${ids.length} 个摊位 / ${files.length} 张`);
