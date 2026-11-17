/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect --
 * 这个组件用 reanimated 的 shared value，lint 的不可变规则不认识 worklet 里的赋值。 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  visible: boolean;
  sources?: ImageSourcePropType[];
  title?: string;
  /** 传了就在底部显示「加入购买清单」 */
  boothId?: string;
  onClose: () => void;
};

export default function PromoViewer({ visible, sources, title, boothId, onClose }: Props) {
  const router = useRouter();
  const list = sources ?? [];
  const [index, setIndex] = useState(0);

  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const reset = () => {
    scale.value = withTiming(1);
    saved.value = 1;
    tx.value = withTiming(0);
    ty.value = withTiming(0);
  };

  // 换图或关闭时复位
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, index]);

  // 打开时定位到第一张
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = saved.value * e.scale;
      scale.value = Math.min(5, Math.max(1, next));
    })
    .onEnd(() => {
      saved.value = scale.value;
      if (scale.value <= 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = startX.value + e.translationX;
        ty.value = startY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      saved.value = 1;
      tx.value = withTiming(0);
      ty.value = withTiming(0);
    });

  const composed = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const current = list[index];
  const total = list.length;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.topBar}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? '图片'}
          </Text>
          <Pressable onPress={onClose} hitSlop={14} style={styles.close}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.stage}>
          {current ? (
            <GestureDetector gesture={composed}>
              <Animated.View style={[styles.imageWrap, animatedStyle]}>
                <Image source={current} style={styles.image} resizeMode="contain" />
              </Animated.View>
            </GestureDetector>
          ) : (
            <Text style={styles.emptyText}>这张图还没准备好</Text>
          )}
        </View>

        <View style={styles.bottom}>
          {total > 1 && (
            <View style={styles.pager}>
              <Pressable
                onPress={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                hitSlop={10}
                style={[styles.pageBtn, index === 0 && styles.pageBtnOff]}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.pageText}>
                {index + 1} / {total}
              </Text>
              <Pressable
                onPress={() => setIndex((i) => Math.min(total - 1, i + 1))}
                disabled={index === total - 1}
                hitSlop={10}
                style={[styles.pageBtn, index === total - 1 && styles.pageBtnOff]}
              >
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {!!boothId && (
            <Pressable
              style={styles.addBtn}
              onPress={() => {
                onClose();
                router.push({ pathname: '/add-item', params: { booth: boothId } });
              }}
            >
              <Ionicons name="add-circle-outline" size={16} color={theme.ink} />
              <Text style={styles.addText}>加入购买清单</Text>
            </Pressable>
          )}

          <Text style={styles.hint}>双指放大 · 拖动查看 · 双击还原</Text>
        </View>
      </View>
    </Modal>
  );
}

const theme = { ink: '#141414' };

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,8,0.98)' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
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
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imageWrap: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  emptyText: { color: '#9C9788', fontSize: 14 },
  bottom: { paddingBottom: 30, paddingHorizontal: 20, gap: 12, alignItems: 'center' },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnOff: { opacity: 0.25 },
  pageText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'stretch',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2E23C',
  },
  addText: { color: '#141414', fontSize: 14, fontWeight: '800' },
  hint: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
});
