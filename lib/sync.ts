import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BuyItem } from '@/data/items';
import type { FestivalEvent } from '@/store/events';
import type { StoredUpload } from '@/store/uploads';

const KEY = 'fes-list/sync/v1';

export type SyncConfig = {
  url: string;
  token: string;
};

export const DEFAULT_SYNC: SyncConfig = {
  url: 'http://47.116.101.152:8080',
  token: '',
};

export async function loadSyncConfig(): Promise<SyncConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SYNC;
    const parsed = JSON.parse(raw) as Partial<SyncConfig>;
    return {
      url: (parsed.url ?? DEFAULT_SYNC.url).replace(/\/+$/, ''),
      token: parsed.token ?? '',
    };
  } catch {
    return DEFAULT_SYNC;
  }
}

export async function saveSyncConfig(cfg: SyncConfig): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({ url: cfg.url.replace(/\/+$/, ''), token: cfg.token }),
  );
}

export type Snapshot = {
  version: 1;
  savedAt: number;
  events: FestivalEvent[];
  currentEventId: string;
  items: BuyItem[];
  uploads: StoredUpload[];
};

function remoteName(u: { id: string }): string {
  return `${u.id}.jpg`;
}

export function remoteImageUrl(cfg: SyncConfig, id: string): string {
  return `${cfg.url}/api/images/${remoteName({ id })}`;
}

async function authFetch(cfg: SyncConfig, path: string, init?: RequestInit) {
  const res = await fetch(`${cfg.url}${path}`, {
    ...init,
    headers: {
      'x-token': cfg.token,
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

/** 把本地快照推到服务器：先传图，再写 state */
export async function pushSnapshot(
  cfg: SyncConfig,
  snap: Omit<Snapshot, 'version' | 'savedAt'>,
  readImage: (key: string) => Promise<string | null>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ images: number }> {
  const local = snap.uploads.filter((u) => !/^https?:/i.test(u.imageKey));
  let done = 0;

  for (const u of local) {
    const b64 = await readImage(u.imageKey);
    if (!b64) continue;
    const res = await authFetch(cfg, `/api/images/${remoteName(u)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ b64 }),
    });
    if (!res.ok) throw new Error(`图片上传失败 ${res.status}`);
    done += 1;
    onProgress?.(done, local.length);
  }

  const payload: Snapshot = {
    version: 1,
    savedAt: Date.now(),
    events: snap.events,
    currentEventId: snap.currentEventId,
    items: snap.items,
    uploads: snap.uploads.map((u) => ({ ...u, imageKey: remoteImageUrl(cfg, u.id) })),
  };

  const res = await authFetch(cfg, '/api/state', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error(`数据上传失败 ${res.status}`);

  return { images: done };
}

/** 从服务器拉快照 */
export async function pullSnapshot(cfg: SyncConfig): Promise<Snapshot | null> {
  const res = await authFetch(cfg, '/api/state');
  if (!res.ok) throw new Error(`读取失败 ${res.status}`);
  const json = (await res.json()) as { data?: Snapshot | null };
  return json.data ?? null;
}
