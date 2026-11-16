import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PriorityChip from '@/components/PriorityChip';
import EventBar from '@/components/EventBar';
import { BOOTH_BY_ID } from '@/data/booths';
import { nextPriority, rankOf, sortByPriority } from '@/lib/priority';
import { formatMoney, moneyStats } from '@/lib/money';
import { useBoothStats, useShopping } from '@/store/shopping';
import { theme, typo } from '@/theme';

type Filter = 'all' | 'todo' | 'done';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '未买' },
  { key: 'done', label: '已买' },
];

export default function ListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, toggle, remove, update } = useShopping();
  const { total, done } = useBoothStats();
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    const visible = items.filter((it) =>
      filter === 'all' ? true : filter === 'todo' ? !it.done : it.done,
    );
    const map = new Map<string, typeof visible>();
    for (const it of visible) {
      const arr = map.get(it.boothId) ?? [];
      arr.push(it);
      map.set(it.boothId, arr);
    }
    return [...map.entries()]
      .map(([boothId, list]) => ({
        boothId,
        booth: BOOTH_BY_ID.get(boothId),
        rank: Math.min(...list.map((i) => rankOf(i.priority))),
        list: sortByPriority(list, (x) => x.title),
      }))
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.boothId.localeCompare(b.boothId)));
  }, [items, filter]);

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const money = useMemo(() => moneyStats(items), [items]);

  const confirmRemove = (id: string, title: string) => {
    Alert.alert('删除这一项？', title, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <EventBar />
      <View style={styles.head}>
        <Text style={styles.title}>清单</Text>
        <Text style={styles.sub}>
          {total === 0 ? '还没有要买的东西' : `${done} / ${total} 已买到`}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>

        <View style={styles.moneyRow}>
          <View style={styles.moneyItem}>
            <Text style={styles.moneyLabel}>预计要花</Text>
            <Text style={styles.moneyValue}>{formatMoney(money.planned)}</Text>
          </View>
          <View style={styles.moneyDivider} />
          <View style={styles.moneyItem}>
            <Text style={styles.moneyLabel}>已花</Text>
            <Text style={styles.moneyValue}>{formatMoney(money.spent)}</Text>
          </View>
          <View style={styles.moneyDivider} />
          <View style={styles.moneyItem}>
            <Text style={styles.moneyLabel}>未花</Text>
            <Text style={styles.moneyValue}>{formatMoney(money.left)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.segmented}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.seg, active && styles.segActive]}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={34} color="#BDB8A6" />
          <Text style={styles.emptyTitle}>
            {total === 0 ? '清单是空的' : filter === 'todo' ? '全部买完了' : '这里还没有东西'}
          </Text>
          <Text style={styles.emptyBody}>
            {total === 0
              ? '去「地图」点一个摊位，把想买的东西加进去。'
              : '切换筛选看看其他项。'}
          </Text>
        </View>
      ) : (
        groups.map(({ boothId, booth, list }) => (
          <View key={boothId} style={styles.group}>
            <Pressable
              style={styles.groupHead}
              onPress={() => router.push({ pathname: '/booth/[id]', params: { id: boothId } })}
            >
              <View style={styles.boothChip}>
                <Text style={styles.boothChipText}>{boothId}</Text>
              </View>
              <Text style={styles.boothName} numberOfLines={1}>
                {booth?.name ?? '未知摊位'}
              </Text>
              <Ionicons name="chevron-forward" size={15} color="#B4AF9D" />
            </Pressable>

            {list.map((it) => (
              <Pressable
                key={it.id}
                style={styles.item}
                onPress={() => toggle(it.id)}
                onLongPress={() => confirmRemove(it.id, it.title)}
                delayLongPress={350}
              >
                <View style={[styles.box, it.done && styles.boxDone]}>
                  {it.done && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </View>
                <View style={styles.itemBody}>
                  <Text style={[styles.itemText, it.done && styles.itemTextDone]}>{it.title}</Text>
                  {!!it.note && (
                    <Text style={[styles.itemNote, it.done && styles.itemTextDone]}>{it.note}</Text>
                  )}
                </View>
                <PriorityChip
                  priority={it.priority}
                  onPress={() => update(it.id, { priority: nextPriority(it.priority) })}
                />
                {!!it.price && (
                  <View style={[styles.priceChip, it.done && styles.priceChipDone]}>
                    <Text style={[styles.priceText, it.done && styles.priceTextDone]}>
                      {it.price}
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/edit-item',
                      params: {
                        id: it.id,
                        boothId: it.boothId,
                        title: it.title,
                        price: it.price ?? '',
                        priority: it.priority ?? 'mid',
                      },
                    })
                  }
                  hitSlop={10}
                  style={styles.delBtn}
                >
                  <Ionicons name="create-outline" size={15} color="#B7AF9A" />
                </Pressable>
                <Pressable
                  onPress={() => confirmRemove(it.id, it.title)}
                  hitSlop={12}
                  style={styles.delBtn}
                >
                  <Ionicons name="trash-outline" size={15} color="#B79C92" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  head: { marginHorizontal: 20, marginTop: 6 },
  title: { ...typo.h1, color: theme.ink },
  sub: { ...typo.small, color: theme.sub, marginTop: 4 },
  barTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2DFD2',
    marginTop: 12,
    overflow: 'hidden',
  },
  barFill: { height: 7, borderRadius: 4, backgroundColor: theme.ink },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  moneyItem: { flex: 1, gap: 3 },
  moneyLabel: { ...typo.small, color: theme.sub, fontWeight: '600' },
  moneyValue: { ...typo.h2, color: theme.ink, fontSize: 17 },
  moneyDivider: { width: 1, height: 26, backgroundColor: theme.line },
  segmented: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#E7E4D8',
    padding: 4,
    borderRadius: 12,
  },
  seg: { flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: 'center' },
  segActive: { backgroundColor: theme.card },
  segText: { ...typo.small, color: theme.sub, fontWeight: '600' },
  segTextActive: { color: theme.ink, fontWeight: '800' },
  group: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  boothChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accent,
  },
  boothChipText: { ...typo.mono, color: theme.ink },
  boothName: { ...typo.body, color: theme.ink, fontWeight: '700', flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  delBtn: { padding: 4 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CFCBB9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxDone: { backgroundColor: theme.ink, borderColor: theme.ink },
  itemText: { ...typo.body, color: theme.ink },
  itemBody: { flex: 1, gap: 2 },
  itemNote: { ...typo.small, color: theme.sub, fontWeight: '500' },
  priceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accentSoft,
  },
  priceChipDone: { backgroundColor: '#EDEAE0' },
  priceText: { ...typo.mono, color: theme.ink },
  priceTextDone: { color: '#B4AF9D' },
  itemTextDone: { color: '#A9A493', textDecorationLine: 'line-through' },
  empty: { alignItems: 'center', paddingTop: 70, gap: 6 },
  emptyTitle: { ...typo.h2, color: theme.ink, marginTop: 6 },
  emptyBody: { ...typo.small, color: theme.sub, textAlign: 'center', paddingHorizontal: 40 },
});
