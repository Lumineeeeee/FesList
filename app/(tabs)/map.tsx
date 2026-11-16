import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EventBar from '@/components/EventBar';
import PromoViewer from '@/components/PromoViewer';
import { MAP_BOOTH } from '@/data/booths';
import { useEvents } from '@/store/events';
import { useUploads } from '@/store/uploads';
import { theme, typo } from '@/theme';

const MAP_ID = MAP_BOOTH.id;

export default function VenueMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uploads, remove, setPrimary } = useUploads();
  const { current } = useEvents();
  const [viewer, setViewer] = useState<number | null>(null);

  const images = useMemo(() => {
    const list = uploads.filter((u) => u.boothId === MAP_ID);
    return [...list].sort((a, b) => {
      if (!!a.primary !== !!b.primary) return a.primary ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
  }, [uploads]);

  const [hero, ...rest] = images;
  const sources = images.map((u) => ({ uri: u.imageUri }));

  // 让大图按自身比例铺满宽度，既不裁切也不留黑边
  const [ratio, setRatio] = useState(1.5);
  const heroUri = hero?.imageUri;
  useEffect(() => {
    if (!heroUri) return;
    let alive = true;
    Image.getSize(
      heroUri,
      (w, h) => {
        if (alive && w > 0 && h > 0) setRatio(w / h);
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [heroUri]);

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('删除这张地图？', title || '删除后可以再传一张', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  const openUpload = () => router.push({ pathname: '/upload', params: { booth: MAP_ID } });

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <EventBar />
        <View style={styles.head}>
          <Text style={styles.title}>场馆地图</Text>
          <Text style={styles.sub}>
            {[current.date, current.venue].filter(Boolean).join(' · ') || current.name}
          </Text>
        </View>

        {!hero ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={30} color="#BDB8A6" />
            <Text style={styles.emptyTitle}>还没有地图</Text>
            <Text style={styles.emptyBody}>传一张场地图，给它起个名字</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Pressable onPress={() => setViewer(0)} accessibilityRole="imagebutton">
              <Image
                source={{ uri: hero.imageUri }}
                style={[styles.heroImage, { aspectRatio: ratio }]}
                resizeMode="contain"
              />
              <View style={styles.expandBadge}>
                <Ionicons name="expand-outline" size={12} color={theme.ink} />
                <Text style={styles.expandText}>点开放大</Text>
              </View>
            </Pressable>

            <View style={styles.nameBar}>
              <View style={styles.pinTag}>
                <Ionicons name="star" size={10} color={theme.ink} />
                <Text style={styles.pinTagText}>优先展示</Text>
              </View>
              <Text style={styles.heroName} numberOfLines={1}>
                {hero.title || '未命名地图'}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push({ pathname: '/upload', params: { replace: hero.id } })}
              hitSlop={8}
              style={styles.edit}
            >
              <Ionicons name="create-outline" size={13} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(hero.id, hero.title)}
              hitSlop={8}
              style={styles.del}
            >
              <Ionicons name="close" size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {rest.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>其他地图（{rest.length}）</Text>
            {rest.map((u, i) => (
              <View key={u.id} style={styles.row}>
                <Pressable onPress={() => setViewer(i + 1)}>
                  <Image source={{ uri: u.imageUri }} style={styles.thumb} resizeMode="cover" />
                </Pressable>
                <Text style={styles.rowName} numberOfLines={1}>
                  {u.title || '未命名地图'}
                </Text>
                <Pressable onPress={() => setPrimary(u.id)} hitSlop={6} style={styles.pinBtn}>
                  <Text style={styles.pinBtnText}>设为优先</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: '/upload', params: { replace: u.id } })}
                  hitSlop={8}
                  style={styles.rowIcon}
                >
                  <Ionicons name="create-outline" size={14} color="#B7AF9A" />
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(u.id, u.title)}
                  hitSlop={8}
                  style={styles.rowIcon}
                >
                  <Ionicons name="close" size={15} color="#B79C92" />
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Pressable style={styles.uploadRow} onPress={openUpload}>
          <Ionicons name="add-circle-outline" size={16} color={theme.ink} />
          <Text style={styles.uploadRowText}>上传地图</Text>
        </Pressable>

        <Text style={styles.footnote}>
          {current.venue.includes('杭州')
            ? '地铁 1 号线 港城大道站 B / C 出口；东登录厅 3 号口进场。现场以指引牌为准。'
            : '现场以指引牌为准。'}
        </Text>
      </ScrollView>

      <PromoViewer
        visible={viewer !== null}
        sources={viewer !== null ? [sources[viewer]] : undefined}
        title={images[viewer ?? 0]?.title || '场馆地图'}
        onClose={() => setViewer(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  screen: { flex: 1, backgroundColor: theme.bg },
  head: { marginHorizontal: 20, marginTop: 14 },
  title: { ...typo.h1, color: theme.ink },
  sub: { ...typo.small, color: theme.sub, marginTop: 4 },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E7E4D8',
    borderWidth: 1,
    borderColor: theme.line,
  },
  heroImage: { width: '100%', backgroundColor: '#DCD9CC' },
  nameBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.card,
  },
  pinTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accent,
  },
  pinTagText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  heroName: { ...typo.body, color: theme.ink, fontWeight: '700', flex: 1 },
  expandBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: theme.accent,
  },
  expandText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  edit: {
    position: 'absolute',
    top: 10,
    right: 46,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  del: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { ...typo.mono, color: theme.sub, marginTop: 20, marginHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 8,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  thumb: { width: 54, height: 54, borderRadius: 9, backgroundColor: '#E7E4D8' },
  rowName: { ...typo.body, color: theme.ink, fontWeight: '600', flex: 1 },
  pinBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: theme.accentSoft,
  },
  pinBtnText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  rowIcon: { padding: 3 },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
  },
  uploadRowText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  empty: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 30,
    borderRadius: 16,
    backgroundColor: '#EDEAE0',
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { ...typo.body, color: theme.ink, fontWeight: '700' },
  emptyBody: { ...typo.small, color: theme.sub },
  footnote: {
    ...typo.small,
    color: '#9C9788',
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 16,
    marginHorizontal: 20,
  },
});
