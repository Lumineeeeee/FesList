import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { theme } from '@/theme';

type Props = {
  onPress: () => void;
  label: string;
};

/** 右下角的圆形「＋」，各页统一用它 */
export default function Fab({ onPress, label }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.fab} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
