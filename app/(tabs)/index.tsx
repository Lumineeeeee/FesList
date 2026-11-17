import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BoothMap from '@/components/BoothMap';
import EventBar from '@/components/EventBar';
import Fab from '@/components/Fab';
import { cellOf, hallOfBooth, isSpecial } from '@/lib/boothId';
import { boothRank } from '@/lib/priority';
import { useEvents } from '@/store/events';
import { useHalls } from '@/store/halls';
import { useBoothStats, useShopping } from '@/store/shopping';
import { theme, typo } from '@/theme';

export default function DoujinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { byBooth, total, done } = useBoothStats();
  const { items } = useShopping();
  const { current } = useEvents();
  const { halls, currentHall, setCurrentHall, boothName, hallOf } = useHalls();

  const wanted = useMemo(() => {
    const keys = [...new Set(items.map((i) => i.boothId))].filter((k) => !isSpecial(k));
    return keys
      .map((key) => ({ key, rank: boothRank(key, items) }))
      .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.key.localeCompare(b.key)));
  }, [items]);

  const openBooth = (key: string) => {
    router.push({ pathname: '/booth/[id]', params: { id: encodeURIComponent(key) } });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <EventBar />

        <View style={styles.head}>
          <Text style={styles.title}>{current.name}</Text>
        </View>

        <View style={styles.hallRow}>
          {halls.map((h) => {
            const active = h.id === currentHall.id;
            return (
              <Pressable
                key={h.id}
                onPress={() => setCurrentHall(h.id)}
                style={[styles.hallChip, active && styles.hallChipActive]}
              >
                <Text style={[styles.hallChipText, active && styles.hallChipTextActive]}>
                  {h.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.hallEdit}
            onPress={() => router.push('/hall')}
            accessibilityLabel="管理馆"
          >
            <Ionicons name="options-outline" size={16} color={theme.sub} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <BoothMap
            hall={currentHall}
            stats={byBooth}
            onPress={(key) => openBooth(key)}
          />
        </View>

        <View style={styles.legend}>
          <Legend color="#FFFFFF" label="没标记" border />
          <Legend color={theme.accent} label="要买" />
          <Legend color={theme.ink} label="已买完" />
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statText}>{wanted.length} 个摊位要去</Text>
          <Text style={styles.statText}>
            {done}/{total} 已买
          </Text>
        </View>

        {wanted.map(({ key }) => {
          const stat = byBooth.get(key);
          const allDone = !!stat && stat.total > 0 && stat.done === stat.total;
          const hall = hallOf(hallOfBooth(key) ?? '');
          return (
            <Pressable key={key} style={styles.row} onPress={() => openBooth(key)}>
              <View style={[styles.cellChip, allDone && styles.cellChipDone]}>
                <Text style={[styles.cellChipText, allDone && styles.cellChipTextDone]}>
                  {cellOf(key)}
                </Text>
              </View>
              <Text style={[styles.rowName, allDone && styles.rowNameDone]} numberOfLines={1}>
                {boothName(key) || '未命名摊位'}
              </Text>
              {!!hall && hall.id !== currentHall.id && (
                <Text style={styles.hallTag}>{hall.name}</Text>
              )}
              {!!stat && (
                <Text style={styles.rowCount}>
                  {stat.done}/{stat.total}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={15} color="#C4BFAD" />
            </Pressable>
          );
        })}
      </ScrollView>

      <Fab onPress={() => router.push('/upload')} label="上传图片" />
    </View>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color },
          border ? { borderWidth: 1, borderColor: theme.line } : null,
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  screen: { flex: 1, backgroundColor: theme.bg },
  head: { marginHorizontal: 20, marginTop: 14 },
  title: { ...typo.h1, color: theme.ink },
  hallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginHorizontal: 16,
  },
  hallChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  hallChipActive: { backgroundColor: theme.ink, borderColor: theme.ink },
  hallChipText: { ...typo.small, color: theme.sub, fontWeight: '700' },
  hallChipTextActive: { color: '#FFFFFF' },
  hallEdit: { marginLeft: 'auto', padding: 6 },
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 18,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 11, height: 11, borderRadius: 3 },
  legendText: { ...typo.small, color: theme.sub, fontWeight: '500' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginHorizontal: 20,
  },
  statText: { ...typo.small, color: theme.sub, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  cellChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.accent,
  },
  cellChipDone: { backgroundColor: theme.ink },
  cellChipText: { ...typo.mono, color: theme.ink },
  cellChipTextDone: { color: '#FFFFFF' },
  rowName: { ...typo.body, color: theme.ink, fontWeight: '700', flex: 1 },
  rowNameDone: { color: '#A9A493' },
  hallTag: { ...typo.small, color: '#A29D8C' },
  rowCount: { ...typo.small, color: theme.sub },
});
