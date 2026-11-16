import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRIORITY_META, type Priority } from '@/data/items';
import { typo } from '@/theme';

type Props = {
  priority?: Priority;
  onPress?: () => void;
};

export default function PriorityChip({ priority, onPress }: Props) {
  const meta = PRIORITY_META[priority ?? 'mid'];
  const chip = (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );

  if (!onPress) return chip;

  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel="切换优先级">
      {chip}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  text: { ...typo.small, fontWeight: '800' },
});
