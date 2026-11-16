import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BoothMap from '@/components/BoothMap';
import Fab from '@/components/Fab';
import EventBar from '@/components/EventBar';
import { BOOTHS, type Booth } from '@/data/booths';
import { boothRank } from '@/lib/priority';
import { useBoothStats, useShopping } from '@/store/shopping';
import { useEvents } from '@/store/events';
import { theme, typo } from '@/theme';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { byBooth, total, done } = useBoothStats();
  const { items } = useShopping();
  const { current } = useEvents();

  const wantedList = useMemo(() => {
    return BOOTHS.filter((b) => (byBooth.get(b.id)?.total ?? 0) > 0).sort((a, b) => {
      const ra = boothRank(a.id, items);
      const rb = boothRank(b.id, items);
      if (ra !== rb) return ra - rb;
      return a.id.localeCompare(b.id);
    });
  }, [byBooth, items]);

  const openBooth = (booth: Booth) => {
    router.push({ pathname: '/booth/[id]', params: { id: booth.id } });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
      <EventBar />
      <View style={styles.header}>
        <Text style={styles.kicker}>{current.name}</Text>
        <Text style={styles.title}>同人区</Text>
        <Text style={styles.meta}>
          {[current.date, current.venue].filter(Boolean).join(' · ') || '摊位 A01–D09'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{wantedList.length}</Text>
            <Text style={styles.statLabel}>个摊位要去</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>
              {done}/{total}
            </Text>
            <Text style={styles.statLabel}>已买到</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <BoothMap booths={BOOTHS} stats={byBooth} onPress={openBooth} />
      </View>

      <View style={styles.legend}>
        <Legend color="#FFFFFF" label="没标记" border />
        <Legend color={theme.accent} label="要买" />
        <Legend color={theme.ink} label="已买完" />
      </View>

      {wantedList.length > 0 ? (
        <>
          <Text style={styles.stripTitle}>要去（{wantedList.length}）</Text>
          <View style={styles.todoList}>
            {wantedList.map((b) => {
              const s = byBooth.get(b.id);
              const allDone = !!s && s.total > 0 && s.done === s.total;
              return (
                <Pressable key={b.id} style={styles.todoRow} onPress={() => openBooth(b)}>
                  <View style={[styles.todoChip, allDone && styles.todoChipDone]}>
                    <Text style={[styles.todoChipText, allDone && styles.todoChipTextDone]}>
                      {b.id}
                    </Text>
                  </View>
                  <Text
                    style={[styles.todoName, allDone && styles.todoNameDone]}
                    numberOfLines={1}
                  >
                    {b.name}
                  </Text>
                  {!!s && (
                    <Text style={styles.todoCount}>
                      {s.done}/{s.total}
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={15} color="#C4BFAD" />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.tip}>
          <Text style={styles.tipTitle}>还没有清单</Text>
          <Text style={styles.tipBody}>
            点任意摊位进去加要买的东西；加过的摊位会变成黄色，买完变黑。
          </Text>
        </View>
      )}
      </ScrollView>

      <Fab onPress={() => router.push('/upload')} label="上传摊宣" />
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
  header: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: theme.accent,
    borderWidth: 2,
    borderColor: theme.ink,
  },
  kicker: { ...typo.mono, color: theme.ink, opacity: 0.6 },
  title: { ...typo.h1, color: theme.ink, marginTop: 4 },
  meta: { ...typo.small, color: theme.ink, opacity: 0.65, marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 18 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statNum: { fontSize: 22, fontWeight: '800', color: theme.ink },
  statLabel: { ...typo.small, color: theme.ink, opacity: 0.6 },
  divider: { width: 1, height: 22, backgroundColor: theme.ink, opacity: 0.15 },
  card: {
    marginTop: 14,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 11, height: 11, borderRadius: 3 },
  legendText: { ...typo.small, color: theme.sub, fontWeight: '500' },
  tip: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EDEAE0',
  },
  tipTitle: { ...typo.body, color: theme.ink, fontWeight: '700' },
  tipBody: { ...typo.small, color: theme.sub, marginTop: 4, lineHeight: 18 },
  stripTitle: { ...typo.h2, color: theme.ink, marginTop: 18, marginHorizontal: 20 },
  todoList: { marginTop: 8, marginHorizontal: 16, gap: 8 },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  todoChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.accent,
  },
  todoChipDone: { backgroundColor: theme.ink },
  todoChipText: { ...typo.mono, color: theme.ink },
  todoChipTextDone: { color: '#FFFFFF' },
  todoName: { ...typo.body, color: theme.ink, fontWeight: '700', flex: 1 },
  todoNameDone: { color: '#A9A493' },
  todoCount: { ...typo.small, color: theme.sub },
});
