import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PromoViewer from '@/components/PromoViewer';
import PriorityChip from '@/components/PriorityChip';
import EventBar from '@/components/EventBar';
import Fab from '@/components/Fab';
import { OFFICIAL_BOOTH } from '@/data/booths';
import { nextPriority, sortByPriority } from '@/lib/priority';
import { useBoothStats, useShopping } from '@/store/shopping';
import { useEvents } from '@/store/events';
import { useUploads } from '@/store/uploads';
import { theme, typo } from '@/theme';

const OFF_ID = OFFICIAL_BOOTH.id;

export default function OfficialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, toggle, remove, update } = useShopping();
  const { uploads, remove: removeUpload } = useUploads();
  const { current } = useEvents();
  const { byBooth } = useBoothStats();
  const [viewer, setViewer] = useState<number | null>(null);

  const officialUploads = uploads.filter((u) => u.boothId === OFF_ID);
  const posters = officialUploads.map((u) => ({ uri: u.imageUri }));
  const mine = sortByPriority(
    items.filter((it) => it.boothId === OFF_ID),
    (x) => x.title,
  );
  const stat = byBooth.get(OFF_ID);

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('删除这一项？', title, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
      <EventBar />
      <View style={styles.head}>
        <Text style={styles.title}>官方周边</Text>
        <Text style={styles.sub}>
          {[current.date, current.venue].filter(Boolean).join(' · ') || current.name}
          {stat ? ` · 要买 ${stat.total} 件` : ''}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>周边情报</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posters}>
        {officialUploads.map((u, i) => (
          <View key={u.id} style={styles.poster}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setViewer(i)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`周边情报第 ${i + 1} 页`}
            >
              <Image source={{ uri: u.imageUri }} style={styles.posterImage} resizeMode="cover" />
              <View style={styles.posterBadge}>
                <Text style={styles.posterBadgeText}>贩售商品 {i + 1}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/upload', params: { replace: u.id } })}
              hitSlop={8}
              style={styles.thumbEdit}
            >
              <Ionicons name="create-outline" size={12} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert('删除这张情报？', '删除后图片文件也会一起清掉', [
                  { text: '取消', style: 'cancel' },
                  { text: '删除', style: 'destructive', onPress: () => removeUpload(u.id) },
                ]);
              }}
              hitSlop={8}
              style={styles.thumbDel}
            >
              <Ionicons name="close" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.posterHint}>点开看价目表，可放大</Text>

      <Pressable
        style={styles.uploadRow}
        onPress={() => router.push({ pathname: '/upload', params: { booth: OFF_ID } })}
      >
        <Ionicons name="add-circle-outline" size={16} color={theme.ink} />
        <Text style={styles.uploadRowText}>上传 / 更换情报</Text>
      </Pressable>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>要买</Text>
      {mine.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="storefront-outline" size={26} color="#BDB8A6" />
          <Text style={styles.emptyTitle}>还没加官方周边</Text>
          <Text style={styles.emptyBody}>
            把要买的告诉我，我加到这里；加完会和同人区一起进总清单。
          </Text>
        </View>
      ) : (
        mine.map((it) => (
          <Pressable key={it.id} style={styles.row} onPress={() => toggle(it.id)}>
            <View style={[styles.box, it.done && styles.boxDone]}>
              {it.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowText, it.done && styles.rowTextDone]}>{it.title}</Text>
              {!!it.note && (
                <Text style={[styles.rowNote, it.done && styles.rowTextDone]}>{it.note}</Text>
              )}
            </View>
            <PriorityChip
              priority={it.priority}
              onPress={() => update(it.id, { priority: nextPriority(it.priority) })}
            />
            {!!it.price && (
              <View style={[styles.priceChip, it.done && styles.priceChipDone]}>
                <Text style={[styles.priceText, it.done && styles.priceTextDone]}>{it.price}</Text>
              </View>
            )}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/edit-item',
                  params: {
                    id: it.id,
                    boothId: it.boothId,
                    title: it.title,
                    price: it.price ?? '',
                    priority: it.priority ?? 'mid',
                  },
                })
              }
              hitSlop={10}
              style={styles.delBtn}
            >
              <Ionicons name="create-outline" size={15} color="#B7AF9A" />
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(it.id, it.title)}
              hitSlop={12}
              style={styles.delBtn}
            >
              <Ionicons name="trash-outline" size={15} color="#B79C92" />
            </Pressable>
          </Pressable>
        ))
      )}

      <PromoViewer
        visible={viewer !== null}
        sources={viewer !== null ? [posters[viewer]] : undefined}
        title={`官方周边 · 贩售商品 ${viewer === 0 ? '①' : '②'}`}
        onClose={() => setViewer(null)}
      />
      </ScrollView>

      <Fab
        onPress={() => router.push({ pathname: '/upload', params: { booth: 'OFF', mode: 'item' } })}
        label="添加官方清单"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  screen: { flex: 1, backgroundColor: theme.bg },
  head: { marginHorizontal: 20, marginTop: 6 },
  title: { ...typo.h1, color: theme.ink },
  sub: { ...typo.small, color: theme.sub, marginTop: 4 },
  delBtn: { padding: 4 },
  sectionLabel: { ...typo.mono, color: theme.sub, marginTop: 18, marginHorizontal: 20 },
  posters: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8 },
  poster: {
    width: 150,
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E7E4D8',
    borderWidth: 1,
    borderColor: theme.line,
  },
  posterImage: { width: '100%', height: '100%' },
  posterBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.accent,
  },
  posterBadgeText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  posterHint: { ...typo.small, color: '#A29D8C', marginTop: 8, marginHorizontal: 20 },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    marginHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
  },
  uploadRowText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  thumbRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  thumbWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  thumbEdit: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDel: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#EDEAE0',
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { ...typo.body, color: theme.ink, fontWeight: '700' },
  emptyBody: { ...typo.small, color: theme.sub, textAlign: 'center', lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CFCBB9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxDone: { backgroundColor: theme.ink, borderColor: theme.ink },
  rowBody: { flex: 1, gap: 2 },
  rowText: { ...typo.body, color: theme.ink },
  rowNote: { ...typo.small, color: theme.sub, fontWeight: '500' },
  rowTextDone: { color: '#A9A493', textDecorationLine: 'line-through' },
  priceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accentSoft,
  },
  priceChipDone: { backgroundColor: '#EDEAE0' },
  priceText: { ...typo.mono, color: theme.ink },
  priceTextDone: { color: '#B4AF9D' },
});
