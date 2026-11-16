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

const STORAGE_KEY = 'fes-list/events/v1';

export type FestivalEvent = {
  id: string;
  name: string;
  date: string;
  venue: string;
  createdAt: number;
};

export const DEFAULT_EVENT: FestivalEvent = {
  id: 'fes-2026',
  name: '绝区零FES 2026',
  date: '11.27 – 11.29',
  venue: '杭州大会展中心',
  createdAt: 0,
};

type EventsValue = {
  ready: boolean;
  events: FestivalEvent[];
  current: FestivalEvent;
  switchTo: (id: string) => void;
  create: (name: string, date?: string, venue?: string) => FestivalEvent;
  rename: (id: string, patch: Partial<Pick<FestivalEvent, 'name' | 'date' | 'venue'>>) => void;
  /** 从服务器拉回来的数据整体替换 */
  replaceAll: (next: FestivalEvent[], currentId?: string) => void;
};

const EventsContext = createContext<EventsValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FestivalEvent[]>([DEFAULT_EVENT]);
  const [currentId, setCurrentId] = useState<string>(DEFAULT_EVENT.id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed = JSON.parse(raw) as {
            events?: FestivalEvent[];
            currentId?: string;
          };
          if (Array.isArray(parsed.events) && parsed.events.length > 0) {
            setEvents(parsed.events);
            const id =
              parsed.currentId && parsed.events.some((e) => e.id === parsed.currentId)
                ? parsed.currentId
                : parsed.events[0].id;
            setCurrentId(id);
          }
        } catch {
          // 坏了就用默认
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

  const persist = useCallback((nextEvents: FestivalEvent[], nextCurrent: string) => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ events: nextEvents, currentId: nextCurrent }),
    ).catch(() => {});
  }, []);

  const switchTo = useCallback(
    (id: string) => {
      setCurrentId(id);
      setEvents((prev) => {
        if (!prev.some((e) => e.id === id)) return prev;
        persist(prev, id);
        return prev;
      });
    },
    [persist],
  );

  const create = useCallback(
    (name: string, date?: string, venue?: string) => {
      const created: FestivalEvent = {
        id: `ev-${Date.now().toString(36)}`,
        name: name.trim() || '新漫展',
        date: date?.trim() ?? '',
        venue: venue?.trim() ?? '',
        createdAt: Date.now(),
      };
      setEvents((prev) => {
        const next = [...prev, created];
        persist(next, created.id);
        return next;
      });
      setCurrentId(created.id);
      return created;
    },
    [persist],
  );

  const rename = useCallback(
    (id: string, patch: Partial<Pick<FestivalEvent, 'name' | 'date' | 'venue'>>) => {
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        persist(next, currentId);
        return next;
      });
    },
    [persist, currentId],
  );

  const replaceAll = useCallback(
    (next: FestivalEvent[], nextCurrentId?: string) => {
      if (!next.length) return;
      const id = nextCurrentId && next.some((e) => e.id === nextCurrentId) ? nextCurrentId : next[0].id;
      setEvents(next);
      setCurrentId(id);
      persist(next, id);
    },
    [persist],
  );

  const current = useMemo(
    () => events.find((e) => e.id === currentId) ?? events[0] ?? DEFAULT_EVENT,
    [events, currentId],
  );

  const value = useMemo<EventsValue>(
    () => ({ ready, events, current, switchTo, create, rename, replaceAll }),
    [ready, events, current, switchTo, create, rename, replaceAll],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents(): EventsValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents 必须在 EventsProvider 内使用');
  return ctx;
}
