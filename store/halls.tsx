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

import { DEFAULT_HALL_ID, defaultHalls, hallCells, type Hall } from '@/data/halls';
import { useEvents } from '@/store/events';

const STORAGE_KEY = 'fes-list/halls/v1';

type HallsValue = {
  ready: boolean;
  /** 当前漫展的馆 */
  halls: Hall[];
  currentHall: Hall;
  setCurrentHall: (id: string) => void;
  addHall: (name: string) => Hall;
  removeHall: (id: string) => void;
  renameHall: (id: string, name: string) => void;
  setLayout: (id: string, rows: string[], cols: number) => void;
  setBoothName: (hallId: string, cell: string, name: string) => void;
  /** 找某个馆 */
  hallOf: (hallId: string) => Hall | undefined;
  /** 任意漫展的馆（导出时用） */
  hallsOf: (eventId: string) => Hall[];
  /** 用 booth key（h1:A05）取摊位名 */
  boothName: (boothId: string) => string;
  replaceAll: (next: Hall[]) => void;
};

type State = {
  byEvent: Record<string, Hall[]>;
  current: Record<string, string>;
};

const HallsContext = createContext<HallsValue | null>(null);

export function HallsProvider({ children }: { children: ReactNode }) {
  const { current: event } = useEvents();
  const [state, setState] = useState<State>({ byEvent: {}, current: {} });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const parsed = JSON.parse(raw) as State;
        if (parsed && parsed.byEvent) setState(parsed);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: State) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const halls = useMemo<Hall[]>(() => {
    return state.byEvent[event.id] ?? defaultHalls();
  }, [state.byEvent, event.id]);

  const currentHall = useMemo<Hall>(() => {
    const id = state.current[event.id];
    return halls.find((h) => h.id === id) ?? halls[0];
  }, [halls, state.current, event.id]);

  const mutate = useCallback(
    (fn: (list: Hall[]) => Hall[]) => {
      const list = state.byEvent[event.id] ?? defaultHalls();
      const nextList = fn(list);
      persist({
        byEvent: { ...state.byEvent, [event.id]: nextList },
        current: state.current,
      });
    },
    [state, event.id, persist],
  );

  const setCurrentHall = useCallback(
    (id: string) => {
      persist({
        byEvent: state.byEvent,
        current: { ...state.current, [event.id]: id },
      });
    },
    [state, event.id, persist],
  );

  const addHall = useCallback(
    (name: string) => {
      const list = state.byEvent[event.id] ?? defaultHalls();
      const id = `h${Date.now().toString(36)}`;
      const hall: Hall = {
        id,
        name: name.trim() || `${list.length + 1} 号馆`,
        rows: ['A', 'B', 'C', 'D'],
        cols: 9,
        booths: {},
      };
      persist({
        byEvent: { ...state.byEvent, [event.id]: [...list, hall] },
        current: { ...state.current, [event.id]: id },
      });
      return hall;
    },
    [state, event.id, persist],
  );

  const removeHall = useCallback(
    (id: string) => {
      const list = state.byEvent[event.id] ?? defaultHalls();
      if (list.length <= 1) return;
      const next = list.filter((h) => h.id !== id);
      persist({
        byEvent: { ...state.byEvent, [event.id]: next },
        current: {
          ...state.current,
          [event.id]: state.current[event.id] === id ? next[0].id : state.current[event.id],
        },
      });
    },
    [state, event.id, persist],
  );

  const renameHall = useCallback(
    (id: string, name: string) => {
      mutate((list) => list.map((h) => (h.id === id ? { ...h, name } : h)));
    },
    [mutate],
  );

  const setLayout = useCallback(
    (id: string, rows: string[], cols: number) => {
      mutate((list) =>
        list.map((h) => (h.id === id ? { ...h, rows: rows.length ? rows : ['A'], cols } : h)),
      );
    },
    [mutate],
  );

  const setBoothName = useCallback(
    (hallId: string, cell: string, name: string) => {
      mutate((list) =>
        list.map((h) => (h.id === hallId ? { ...h, booths: { ...h.booths, [cell]: name } } : h)),
      );
    },
    [mutate],
  );

  const hallOf = useCallback((hallId: string) => halls.find((h) => h.id === hallId), [halls]);

  const hallsOf = useCallback(
    (eventId: string) => state.byEvent[eventId] ?? defaultHalls(),
    [state.byEvent],
  );

  const boothName = useCallback(
    (boothId: string) => {
      if (boothId === 'OFF') return '官方周边贩售区';
      if (boothId === 'MAP') return '场馆地图';
      const [hallId, cell] = boothId.includes(':') ? boothId.split(':') : [DEFAULT_HALL_ID, boothId];
      const hall = halls.find((h) => h.id === hallId) ?? halls[0];
      return hall?.booths?.[cell] ?? '';
    },
    [halls],
  );

  const replaceAll = useCallback(
    (next: Hall[]) => {
      persist({
        byEvent: { ...state.byEvent, [event.id]: next.length ? next : defaultHalls() },
        current: { ...state.current, [event.id]: next[0]?.id ?? DEFAULT_HALL_ID },
      });
    },
    [state, event.id, persist],
  );

  const value = useMemo<HallsValue>(
    () => ({
      ready,
      halls,
      currentHall,
      setCurrentHall,
      addHall,
      removeHall,
      renameHall,
      setLayout,
      setBoothName,
      hallOf,
      hallsOf,
      boothName,
      replaceAll,
    }),
    [
      ready,
      halls,
      currentHall,
      setCurrentHall,
      addHall,
      removeHall,
      renameHall,
      setLayout,
      setBoothName,
      hallOf,
      hallsOf,
      boothName,
      replaceAll,
    ],
  );

  return <HallsContext.Provider value={value}>{children}</HallsContext.Provider>;
}

export function useHalls(): HallsValue {
  const ctx = useContext(HallsContext);
  if (!ctx) throw new Error('useHalls 必须在 HallsProvider 内使用');
  return ctx;
}

export const allHallCells = hallCells;
