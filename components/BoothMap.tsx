import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cellId, type Hall } from '@/data/halls';
import { theme, typo } from '@/theme';

type Props = {
  hall: Hall;
  stats: Map<string, { total: number; done: number }>;
  onPress: (boothKey: string, cell: string) => void;
  compact?: boolean;
};

function BoothMap({ hall, stats, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.labelCol} />
        {Array.from({ length: hall.cols }, (_, i) => (
          <View key={i} style={styles.headCell}>
            <Text style={styles.headText}>{i + 1}</Text>
          </View>
        ))}
      </View>

      {hall.rows.map((row) => (
        <View key={row} style={styles.row}>
          <View style={styles.labelCol}>
            <Text style={styles.rowLabel}>{row}</Text>
          </View>
          {Array.from({ length: hall.cols }, (_, i) => {
            const cell = cellId(row, i + 1);
            const key = `${hall.id}:${cell}`;
            const stat = stats.get(key);
            const total = stat?.total ?? 0;
            const done = stat?.done ?? 0;
            const allDone = total > 0 && done === total;
            const wanted = total > 0 && !allDone;

            return (
              <Pressable
                key={cell}
                onPress={() => onPress(key, cell)}
                style={({ pressed }) => [
                  styles.cell,
                  wanted && styles.cellWanted,
                  allDone && styles.cellDone,
                  pressed && styles.cellPressed,
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    wanted && styles.cellTextWanted,
                    allDone && styles.cellTextDone,
                  ]}
                >
                  {String(i + 1).padStart(2, '0')}
                </Text>
                {total > 0 && (
                  <View style={[styles.badge, allDone && styles.badgeDone]}>
                    <Text style={[styles.badgeText, allDone && styles.badgeTextDone]}>{total}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default memo(BoothMap);

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelCol: { width: 18, alignItems: 'center' },
  rowLabel: { ...typo.mono, color: theme.sub },
  headCell: { flex: 1, alignItems: 'center' },
  headText: { fontSize: 9, fontWeight: '700', color: '#B4AF9D' },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWanted: { backgroundColor: theme.accent, borderColor: theme.accent },
  cellDone: { backgroundColor: theme.ink, borderColor: theme.ink },
  cellPressed: { opacity: 0.65 },
  cellText: { ...typo.mono, fontSize: 11, color: theme.ink },
  cellTextWanted: { color: theme.accentInk, fontWeight: '800' },
  cellTextDone: { color: '#FFFFFF' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.ink },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  badgeTextDone: { color: theme.ink },
});
