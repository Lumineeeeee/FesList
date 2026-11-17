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

import { useEvents } from '@/store/events';

const STORAGE_KEY = 'fes-list/links/v1';

export type InfoLink = {
  id: string;
  eventId: string;
  /** h1:A05 / OFF / MAP */
  boothId: string;
  title: string;
  url: string;
};

type LinksValue = {
  allLinks: InfoLink[];
  links: InfoLink[];
  linksOf: (boothId: string) => InfoLink[];
  add: (boothId: string, title: string, url: string) => void;
  update: (id: string, patch: { title?: string; url?: string }) => void;
  remove: (id: string) => void;
  replaceAll: (next: InfoLink[]) => void;
};

const LinksContext = createContext<LinksValue | null>(null);

export function LinksProvider({ children }: { children: ReactNode }) {
  const { current } = useEvents();
  const [all, setAll] = useState<InfoLink[]>([]);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const parsed = JSON.parse(raw) as InfoLink[];
        if (Array.isArray(parsed)) setAll(parsed);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: InfoLink[]) => {
    setAll(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const links = useMemo(() => all.filter((l) => l.eventId === current.id), [all, current.id]);

  const add = useCallback(
    (boothId: string, title: string, url: string) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) return;
      const entry: InfoLink = {
        id: `lk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        eventId: current.id,
        boothId,
        title: title.trim() || '链接',
        url: cleanUrl,
      };
      setAll((prev) => {
        const next = [...prev, entry];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [current.id],
  );

  const update = useCallback(
    (id: string, patch: { title?: string; url?: string }) => {
      setAll((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setAll((prev) => {
      const next = prev.filter((l) => l.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const linksOf = useCallback((boothId: string) => links.filter((l) => l.boothId === boothId), [links]);

  const value = useMemo<LinksValue>(
    () => ({ allLinks: all, links, linksOf, add, update, remove, replaceAll: persist }),
    [all, links, linksOf, add, update, remove, persist],
  );

  return <LinksContext.Provider value={value}>{children}</LinksContext.Provider>;
}

export function useLinks(): LinksValue {
  const ctx = useContext(LinksContext);
  if (!ctx) throw new Error('useLinks 必须在 LinksProvider 内使用');
  return ctx;
}
