import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROWS, type Booth } from '@/data/booths';
import { theme, typo } from '@/theme';

type Props = {
  booths: Booth[];
  stats: Map<string, { total: number; done: number }>;
  onPress: (booth: Booth) => void;
};

const LABEL_W = 20;
const GAP = 6;
const COLS = 9;
const MAX_CELL = 46;

function cellSizeFor(width: number): number {
  const usable = width - LABEL_W - GAP * COLS;
  return Math.max(18, Math.min(MAX_CELL, Math.floor(usable / COLS)));
}

function BoothCell({
  booth,
  size,
  stat,
  onPress,
}: {
  booth: Booth;
  size: number;
  stat?: { total: number; done: number };
  onPress: (booth: Booth) => void;
}) {
  const total = stat?.total ?? 0;
  const done = stat?.done ?? 0;
  const allDone = total > 0 && done === total;
  const wanted = total > 0 && !allDone;
  const radius = Math.round(size * 0.24);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booth.id} ${booth.name}${total ? `，要买 ${total} 件` : ''}`}
      onPress={() => onPress(booth)}
      style={({ pressed }) => [
        styles.cell,
        { width: size, height: size, borderRadius: radius },
        wanted && styles.cellWanted,
        allDone && styles.cellDone,
        pressed && styles.cellPressed,
      ]}
    >
      <Text
        style={[
          styles.cellText,
          { fontSize: Math.max(9, Math.round(size * 0.34)) },
          wanted && styles.cellTextWanted,
          allDone && styles.cellTextDone,
        ]}
      >
        {String(booth.col).padStart(2, '0')}
      </Text>
      {total > 0 && (
        <View style={[styles.badge, allDone && styles.badgeDone]}>
          <Text style={[styles.badgeText, allDone && styles.badgeTextDone]}>{total}</Text>
        </View>
      )}
    </Pressable>
  );
}

const BoothMap = memo(function BoothMap({ booths, stats, onPress }: Props) {
  const [width, setWidth] = useState(0);
  const size = cellSizeFor(width || 320);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0) setWidth(w);
      }}
    >
      <View style={styles.row}>
        <View style={{ width: LABEL_W }} />
        {Array.from({ length: COLS }, (_, i) => (
          <View key={i} style={{ width: size }}>
            <Text style={styles.headText}>{i + 1}</Text>
          </View>
        ))}
      </View>

      {ROWS.map((row) => (
        <View key={row} style={styles.row}>
          <View style={{ width: LABEL_W }}>
            <Text style={styles.rowLabelText}>{row}</Text>
          </View>
          {booths
            .filter((b) => b.row === row)
            .map((booth) => (
              <BoothCell
                key={booth.id}
                booth={booth}
                size={size}
                stat={stats.get(booth.id)}
                onPress={onPress}
              />
            ))}
        </View>
      ))}
    </View>
  );
});

export default BoothMap;

const styles = StyleSheet.create({
  wrap: { gap: GAP },
  row: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  rowLabelText: { ...typo.mono, color: theme.sub, textAlign: 'center' },
  headText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B4AF9D',
    textAlign: 'center',
  },
  cell: {
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWanted: { backgroundColor: theme.accent, borderColor: theme.accent },
  cellDone: { backgroundColor: theme.ink, borderColor: theme.ink },
  cellPressed: { opacity: 0.65 },
  cellText: { ...typo.mono, color: theme.ink },
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
