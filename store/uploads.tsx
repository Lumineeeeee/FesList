import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { buildPromoSeed, type SeedRecord } from '@/data/promoSeed';
import { deleteImage, loadImage, saveImage } from '@/lib/imageStore';
import { DEFAULT_EVENT, useEvents } from '@/store/events';

const STORAGE_KEY = 'fes-list/uploads/v2';
// v4：地图变成多张，每张有名字，并且可以指定优先展示
const SEEDED_KEY = 'fes-list/uploads/seeded/v4';

/** 落盘的记录：只存 key，不存地址 */
type StoredUpload = {
  id: string;
  /** 属于哪一场漫展 */
  eventId: string;
  /** 摊位号，A05 / B09 / OFF / MAP */
  boothId: string;
  title: string;
  price?: string;
  /** 地图专用：优先展示的那一张 */
  primary?: boolean;
  imageKey: string;
  createdAt: number;
};

/** 运行时记录：带可直接显示的地址 */
export type Upload = StoredUpload & { imageUri: string };

type UploadInput = {
  boothId: string;
  title: string;
  price?: string;
  imageUri: string;
};

type UploadsValue = {
  ready: boolean;
  /** 当前漫展的图片 */
  uploads: Upload[];
  add: (input: UploadInput) => Promise<Upload>;
  replace: (id: string, imageUri: string) => Promise<void>;
  /** 把某张图设为同摊位优先展示 */
  setPrimary: (id: string) => void;
  remove: (id: string) => void;
};

const UploadsContext = createContext<UploadsValue | null>(null);

export function UploadsProvider({ children }: { children: ReactNode }) {
  const { current } = useEvents();
  const [all, setAll] = useState<Upload[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      let stored: StoredUpload[] = [];
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            stored = (parsed as StoredUpload[]).map((s) => ({
              ...s,
              eventId: s.eventId ?? DEFAULT_EVENT.id,
            }));
          }
        }
      } catch {
        stored = [];
      }

      // 首次启动：把内置摊宣灌进库里，之后它们和用户上传的一样可改可删
      try {
        if (!(await AsyncStorage.getItem(SEEDED_KEY))) {
          // 旧版只有一张地图，先清掉再重新灌四张
          stored = stored.filter((s) => !s.id.startsWith('seed-MAP-'));

          const seeds: SeedRecord[] = await buildPromoSeed();
          const existing = new Set(stored.map((s) => s.id));
          const fresh: StoredUpload[] = seeds
            .filter((s) => !existing.has(s.id))
            .map((s) => ({
              id: s.id,
              eventId: DEFAULT_EVENT.id,
              boothId: s.boothId,
              title: s.title,
              primary: s.primary,
              imageKey: s.imageKey,
              createdAt: s.createdAt,
            }));
          stored = [...stored, ...fresh];
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          await AsyncStorage.setItem(SEEDED_KEY, '1');
        }
      } catch {
        // 灌种子失败就当作没有
      }

      const resolved = await Promise.all(
        stored.map(async (s) => ({ ...s, imageUri: await loadImage(s.imageKey) })),
      );
      if (alive) setAll(resolved.filter((u) => !!u.imageUri));
    })().finally(() => {
      if (alive) setReady(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: Upload[]) => {
    const stored: StoredUpload[] = next.map((u) => ({
      id: u.id,
      eventId: u.eventId,
      boothId: u.boothId,
      title: u.title,
      price: u.price,
      primary: u.primary,
      imageKey: u.imageKey,
      createdAt: u.createdAt,
    }));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored)).catch(() => {});
  }, []);

  const add = useCallback(
    async (input: UploadInput) => {
      const id = `up-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
      const imageKey = await saveImage(id, input.imageUri);
      const imageUri = await loadImage(imageKey);

      const entry: Upload = {
        id,
        eventId: current.id,
        boothId: input.boothId,
        title: input.title,
        price: input.price,
        imageKey,
        imageUri,
        createdAt: Date.now(),
      };

      setAll((prev) => {
        const next = [entry, ...prev];
        persist(next);
        return next;
      });

      return entry;
    },
    [persist, current.id],
  );

  const replace = useCallback(
    async (id: string, imageUri: string) => {
      const imageKey = await saveImage(id, imageUri);
      const display = await loadImage(imageKey);
      setAll((prev) => {
        const next = prev.map((u) =>
          u.id === id ? { ...u, imageKey, imageUri: display, createdAt: Date.now() } : u,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      setAll((prev) => {
        const target = prev.find((u) => u.id === id);
        const next = prev.filter((u) => u.id !== id);
        persist(next);
        if (target) deleteImage(target.imageKey).catch(() => {});
        return next;
      });
    },
    [persist],
  );

  const setPrimary = useCallback(
    (id: string) => {
      setAll((prev) => {
        const target = prev.find((u) => u.id === id);
        if (!target) return prev;
        const next = prev.map((u) =>
          u.boothId === target.boothId && u.eventId === target.eventId
            ? { ...u, primary: u.id === id }
            : u,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const uploads = useMemo(() => all.filter((u) => u.eventId === current.id), [all, current.id]);

  const value = useMemo<UploadsValue>(
    () => ({ ready, uploads, add, replace, setPrimary, remove }),
    [ready, uploads, add, replace, setPrimary, remove],
  );

  return <UploadsContext.Provider value={value}>{children}</UploadsContext.Provider>;
}

export function useUploads(): UploadsValue {
  const ctx = useContext(UploadsContext);
  if (!ctx) throw new Error('useUploads 必须在 UploadsProvider 内使用');
  return ctx;
}

/** 某摊位用户自己上传的摊宣，新的在前 */
export function useBoothUploads(boothId: string | undefined): Upload[] {
  const { uploads } = useUploads();
  return useMemo(
    () => (boothId ? uploads.filter((u) => u.boothId === boothId) : []),
    [uploads, boothId],
  );
}
