import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  visible: boolean;
  sources?: ImageSourcePropType[];
  title?: string;
  onClose: () => void;
};

export default function PromoViewer({ visible, sources, title, onClose }: Props) {
  const list = sources ?? [];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.topBar}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? '摊宣'}
          </Text>
          <Pressable onPress={onClose} hitSlop={14} style={styles.close}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {list.length > 0 ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {list.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={`摊宣第 ${i + 1} 张`}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>这张图还没准备好</Text>
          </View>
        )}

        <Text style={styles.hint}>
          {list.length > 1 ? `共 ${list.length} 张 · 上下滑动` : '点右上角关闭'}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,10,10,0.97)' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12 },
  image: { width: '100%', height: 520 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9C9788', fontSize: 14 },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 30,
  },
});
