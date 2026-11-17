import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { Platform } from 'react-native';

import type { Hall } from '@/data/halls';
import type { BuyItem } from '@/data/items';
import type { FestivalEvent } from '@/store/events';
import type { InfoLink } from '@/store/links';
import type { StoredUpload } from '@/store/uploads';
import { readImageBase64 } from '@/lib/imageStore';

export const INFO_TYPE = 'fes-event-info';
export const ITEMS_TYPE = 'fes-event-items';
const VERSION = 2;

export type InfoJson = {
  type: typeof INFO_TYPE;
  version: number;
  event: Pick<FestivalEvent, 'id' | 'name' | 'date' | 'venue'>;
  halls: Hall[];
  images: {
    id: string;
    boothId: string;
    title: string;
    primary?: boolean;
    createdAt: number;
    file: string;
  }[];
  links: Pick<InfoLink, 'id' | 'boothId' | 'title' | 'url'>[];
};

export type ItemsJson = {
  type: typeof ITEMS_TYPE;
  version: number;
  event: Pick<FestivalEvent, 'id' | 'name' | 'date' | 'venue'>;
  items: Omit<BuyItem, 'eventId'>[];
};

function safeName(name: string): string {
  return (name || '漫展').replace(/[\\/:*?"<>|]/g, '_').trim() || '漫展';
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  return btoa(bin);
}

async function writeOut(name: string, data: Uint8Array | string, mime: string) {
  if (Platform.OS === 'web') {
    const blob =
      typeof data === 'string'
        ? new Blob([data], { type: mime })
        : new Blob([data as unknown as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return;
  }

  const b64 =
    typeof data === 'string' ? btoa(unescape(encodeURIComponent(data))) : bytesToBase64(data);
  const dir = FileSystem.cacheDirectory ?? '';
  const path = `${dir}${name}`;
  await FileSystem.writeAsStringAsync(path, b64, { encoding: 'base64' } as never);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: mime, dialogTitle: name });
  }
}

/** 导出「信息」压缩包：info.json（含排布 + 链接）+ images/ */
export async function exportInfo(
  event: FestivalEvent,
  uploads: StoredUpload[],
  halls: Hall[],
  links: InfoLink[],
) {
  const zip = new JSZip();
  const images: InfoJson['images'] = [];

  for (const u of uploads) {
    const b64 = await readImageBase64(u.imageKey);
    if (!b64) continue;
    const ext = u.imageKey.split('.').pop()?.toLowerCase();
    const file = `images/${u.id}.${ext === 'png' || ext === 'webp' ? ext : 'jpg'}`;
    zip.file(file, b64, { base64: true });
    images.push({
      id: u.id,
      boothId: u.boothId,
      title: u.title,
      primary: u.primary,
      createdAt: u.createdAt,
      file,
    });
  }

  const info: InfoJson = {
    type: INFO_TYPE,
    version: VERSION,
    event: { id: event.id, name: event.name, date: event.date, venue: event.venue },
    halls,
    images,
    links: links.map((l) => ({ id: l.id, boothId: l.boothId, title: l.title, url: l.url })),
  };
  zip.file('info.json', JSON.stringify(info, null, 2));

  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  await writeOut(`${safeName(event.name)}-信息.zip`, bytes, 'application/zip');
  return { images: images.length, links: info.links.length, halls: halls.length };
}

/** 导出「清单」JSON */
export async function exportItems(event: FestivalEvent, items: BuyItem[]) {
  const payload: ItemsJson = {
    type: ITEMS_TYPE,
    version: VERSION,
    event: { id: event.id, name: event.name, date: event.date, venue: event.venue },
    items: items.map(({ eventId: _eventId, ...rest }) => rest),
  };
  await writeOut(
    `${safeName(event.name)}-清单.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  );
  return { items: payload.items.length };
}

export type ImportResult =
  | {
      kind: 'info';
      info: InfoJson;
      images: { name: string; base64: string }[];
    }
  | { kind: 'items'; items: ItemsJson };

/** 选一个 zip/json 读进来 */
export async function pickImport(): Promise<ImportResult | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/x-zip-compressed', 'application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;

  const asset = res.assets[0];
  const name = asset.name ?? '';

  if (Platform.OS === 'web' && (asset as { file?: File }).file) {
    const file = (asset as { file: File }).file;
    if (name.endsWith('.json')) {
      return parseItems(await file.text());
    }
    return readZip(new Uint8Array(await file.arrayBuffer()));
  }

  const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' } as never);
  if (name.endsWith('.json')) {
    return parseItems(decodeURIComponent(escape(atob(b64))));
  }
  return readZip(base64ToBytes(b64));
}

function parseItems(text: string): ImportResult {
  const json = JSON.parse(text) as ItemsJson;
  if (json.type !== ITEMS_TYPE) throw new Error('这不是「清单」文件');
  return { kind: 'items', items: json };
}

async function readZip(bytes: Uint8Array): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(bytes);
  const infoFile = zip.file('info.json');
  if (!infoFile) throw new Error('压缩包里没有 info.json');
  const info = JSON.parse(await infoFile.async('string')) as InfoJson;
  if (info.type !== INFO_TYPE) throw new Error('这不是「信息」压缩包');

  const images: { name: string; base64: string }[] = [];
  for (const item of info.images ?? []) {
    const f = zip.file(item.file);
    if (!f) continue;
    images.push({ name: item.id, base64: await f.async('base64') });
  }
  return { kind: 'info', info, images };
}
