import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PromoViewer from '@/components/PromoViewer';
import PriorityChip from '@/components/PriorityChip';
import { BOOTH_BY_ID } from '@/data/booths';
import { nextPriority, sortByPriority } from '@/lib/priority';
import { useShopping } from '@/store/shopping';
import { useBoothUploads, useUploads } from '@/store/uploads';
import { theme, typo } from '@/theme';

function buzz() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export default function BoothScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const booth = id ? BOOTH_BY_ID.get(id) : undefined;
  const uploaded = useBoothUploads(id);
  const promos = useMemo(() => uploaded.map((u) => ({ uri: u.imageUri })), [uploaded]);
  const cover = promos[0];
  const { items, add, toggle, remove, update } = useShopping();
  const { remove: removeUpload } = useUploads();
  const [draft, setDraft] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  const mine = useMemo(
    () => sortByPriority(items.filter((it) => it.boothId === id), (x) => x.title),
    [items, id],
  );
  const doneCount = mine.filter((it) => it.done).length;

  const submit = () => {
    if (!id || !draft.trim()) return;
    add(id, draft);
    setDraft('');
    buzz();
  };

  const confirmRemove = (itemId: string, title: string) => {
    Alert.alert('删除这一项？', title, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(itemId) },
    ]);
  };

  const confirmDeleteUpload = (uploadId: string) => {
    Alert.alert('删除这张摊宣？', '删除后图片文件也会一起清掉', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeUpload(uploadId) },
    ]);
  };

  if (!booth) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>找不到这个摊位</Text>
        <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>返回</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 6 }}>
        <View style={styles.topBar}>
          <View style={styles.handle} />
          <Pressable onPress={() => router.back()} style={styles.close} hitSlop={12}>
            <Ionicons name="close" size={20} color={theme.ink} />
          </Pressable>
        </View>

        <View style={styles.head}>
          <View style={styles.idChip}>
            <Text style={styles.idChipText}>{booth.id}</Text>
          </View>
          <Text style={styles.title}>{booth.name}</Text>
          <Text style={styles.sub}>
            {mine.length === 0
              ? '还没标记要买的东西'
              : `要买 ${mine.length} 件 · 已买 ${doneCount} 件`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>摊宣</Text>
        {cover ? (
          <Pressable
            style={styles.promoCard}
            onPress={() => setViewerOpen(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`${booth.id} 摊宣图，点击放大`}
          >
            <Image source={cover} style={styles.promoImage} resizeMode="contain" />
            <View style={styles.promoBadge}>
              <Ionicons name="expand-outline" size={12} color={theme.ink} />
              <Text style={styles.promoBadgeText}>
                {promos && promos.length > 1 ? `${promos.length} 张 · 点开看` : '点开看大图'}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.promoEmpty}>
            <Ionicons name="image-outline" size={22} color="#BDB8A6" />
            <Text style={styles.promoEmptyText}>
              还没有这个摊位的摊宣图{'\n'}把图放进 assets/promo/{booth.id}.jpg 后运行 npm run gen:promo
            </Text>
          </View>
        )}

        <Pressable
          style={styles.uploadRow}
          onPress={() =>
            router.push({ pathname: '/upload', params: { booth: booth.id } })
          }
        >
          <Ionicons name="add-circle-outline" size={16} color={theme.ink} />
          <Text style={styles.uploadRowText}>上传 / 更换摊宣</Text>
        </Pressable>

        {uploaded.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
              全部摊宣（{uploaded.length}）
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.thumbRow}>
                {uploaded.map((u) => (
                  <View key={u.id} style={styles.thumbWrap}>
                    <Image source={{ uri: u.imageUri }} style={styles.thumb} resizeMode="cover" />
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/upload', params: { replace: u.id } })
                      }
                      hitSlop={8}
                      style={styles.thumbEdit}
                    >
                      <Ionicons name="create-outline" size={12} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDeleteUpload(u.id)}
                      hitSlop={8}
                      style={styles.thumbDel}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>要买</Text>
        {mine.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>在下面写下这个摊位要买的东西</Text>
          </View>
        ) : (
          mine.map((it) => (
            <Pressable
              key={it.id}
              style={styles.row}
              onPress={() => {
                toggle(it.id);
                buzz();
              }}
              onLongPress={() => confirmRemove(it.id, it.title)}
              delayLongPress={350}
            >
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
                  <Text style={[styles.priceText, it.done && styles.priceTextDone]}>
                    {it.price}
                  </Text>
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
                onPress={() => confirmRemove(it.id, it.title)}
                hitSlop={12}
                style={styles.delBtn}
              >
                <Ionicons name="trash-outline" size={15} color="#B79C92" />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="要买什么？比如：新刊 1 本"
          placeholderTextColor="#B0AB99"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={submit}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim()}
          style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
        >
          <Text style={styles.addBtnText}>添加</Text>
        </Pressable>
      </View>

      <PromoViewer
        visible={viewerOpen}
        sources={promos}
        title={`${booth.id} · ${booth.name}`}
        onClose={() => setViewerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  topBar: { alignItems: 'center', height: 28, justifyContent: 'center' },
  handle: { width: 38, height: 5, borderRadius: 3, backgroundColor: '#D6D2C3' },
  close: {
    position: 'absolute',
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E7E4D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { paddingHorizontal: 22, paddingTop: 12 },
  idChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accent,
  },
  idChipText: { ...typo.mono, color: theme.ink },
  title: { ...typo.h1, color: theme.ink, marginTop: 8 },
  sub: { ...typo.small, color: theme.sub, marginTop: 5 },
  body: { padding: 16, paddingTop: 10 },
  sectionLabel: { ...typo.mono, color: theme.sub, marginBottom: 8 },
  promoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EFECE1',
    borderWidth: 1,
    borderColor: theme.line,
  },
  promoImage: { width: '100%', height: 300 },
  promoBadge: {
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
  promoBadgeText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  promoEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D3CFC0',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
  },
  promoEmptyText: {
    ...typo.small,
    color: '#A29D8C',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  empty: { paddingVertical: 26, alignItems: 'center' },
  emptyText: { ...typo.small, color: theme.sub },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
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
  rowText: { ...typo.body, color: theme.ink },
  rowBody: { flex: 1, gap: 2 },
  rowNote: { ...typo.small, color: theme.sub, fontWeight: '500' },
  priceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accentSoft,
  },
  priceChipDone: { backgroundColor: '#EDEAE0' },
  priceText: { ...typo.mono, color: theme.ink },
  priceTextDone: { color: '#B4AF9D' },
  delBtn: { padding: 4 },
  thumbRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  thumbWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
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
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
  },
  uploadRowText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  rowTextDone: { color: '#A9A493', textDecorationLine: 'line-through' },
  inputBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: theme.card,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F0EEE4',
    ...typo.body,
    color: theme.ink,
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#C9C5B4' },
  addBtnText: { ...typo.body, color: '#FFFFFF', fontWeight: '700' },
  primaryBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.ink,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
