import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useEvents } from '@/store/events';
import { theme, typo } from '@/theme';

export default function EventBar() {
  const router = useRouter();
  const { current, events } = useEvents();

  return (
    <Pressable
      style={styles.bar}
      onPress={() => router.push('/events')}
      accessibilityRole="button"
      accessibilityLabel={`当前漫展 ${current.name}，点击切换`}
    >
      <View style={styles.dot} />
      <Text style={styles.name} numberOfLines={1}>
        {current.name}
      </Text>
      <Text style={styles.count}>{events.length} 场</Text>
      <Ionicons name="swap-horizontal" size={15} color={theme.sub} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.ink },
  name: { ...typo.small, color: theme.ink, fontWeight: '800', flex: 1 },
  count: { ...typo.small, color: '#A9A493', fontWeight: '600' },
});
