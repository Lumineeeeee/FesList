import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { SEED_ITEMS, type BuyItem, type Priority } from '@/data/items';
import { migrateBoothId } from '@/lib/boothId';
import { DEFAULT_EVENT, useEvents } from '@/store/events';

const STORAGE_KEY = 'fes-list/items/v2';

type ShoppingValue = {
  ready: boolean;
  /** 当前漫展的条目 */
  items: BuyItem[];
  /** 全部漫展的条目，同步用 */
  allItems: BuyItem[];
  add: (boothId: string, title: string, price?: string) => void;
  update: (
    id: string,
    patch: { boothId?: string; title?: string; price?: string; priority?: Priority },
  ) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearDone: () => void;
  /** 从服务器拉回来的数据整体替换 */
  replaceAll: (next: BuyItem[]) => void;
};

const ShoppingContext = createContext<ShoppingValue | null>(null);

function withEvent(item: BuyItem, eventId: string): BuyItem {
  return { ...item, eventId, boothId: migrateBoothId(item.boothId) };
}

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const { current } = useEvents();
  const [all, setAll] = useState<BuyItem[]>(() =>
    SEED_ITEMS.map((i) => withEvent(i, DEFAULT_EVENT.id)),
  );
  const [ready, setReady] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const migrated = (parsed as BuyItem[])
              .filter((x) => x && typeof x.id === 'string')
              // 老数据没有 eventId，归到默认漫展
              .map((x) => withEvent(x, x.eventId ?? DEFAULT_EVENT.id));
            setAll(migrated);
          }
        } catch {
          // 本地数据坏了就退回种子数据
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all)).catch(() => {});
  }, [all, ready]);

  const items = useMemo(() => all.filter((i) => i.eventId === current.id), [all, current.id]);

  const add = useCallback(
    (boothId: string, title: string, price?: string) => {
      const clean = title.trim();
      if (!clean) return;
      seq.current += 1;
      const id = `${boothId}-${Date.now().toString(36)}-${seq.current}`;
      setAll((prev) => [
        ...prev,
        {
          id,
          eventId: current.id,
          boothId,
          title: clean,
          price,
          done: false,
          priority: 'mid' as Priority,
        },
      ]);
    },
    [current.id],
  );

  const update = useCallback(
    (
      id: string,
      patch: { boothId?: string; title?: string; price?: string; priority?: Priority },
    ) => {
      setAll((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    },
    [],
  );

  const toggle = useCallback((id: string) => {
    setAll((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  }, []);

  const remove = useCallback((id: string) => {
    setAll((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setAll((prev) => prev.filter((it) => !it.done || it.eventId !== current.id));
  }, [current.id]);

  const replaceAll = useCallback((next: BuyItem[]) => {
    setAll(next);
  }, []);

  const value = useMemo<ShoppingValue>(
    () => ({ ready, items, allItems: all, add, update, toggle, remove, clearDone, replaceAll }),
    [ready, items, all, add, update, toggle, remove, clearDone, replaceAll],
  );

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping(): ShoppingValue {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShopping 必须在 ShoppingProvider 内使用');
  return ctx;
}

export function useBoothStats() {
  const { items } = useShopping();
  return useMemo(() => {
    const byBooth = new Map<string, { total: number; done: number }>();
    let total = 0;
    let done = 0;
    for (const it of items) {
      total += 1;
      if (it.done) done += 1;
      const s = byBooth.get(it.boothId) ?? { total: 0, done: 0 };
      s.total += 1;
      if (it.done) s.done += 1;
      byBooth.set(it.boothId, s);
    }
    return { byBooth, total, done };
  }, [items]);
}
