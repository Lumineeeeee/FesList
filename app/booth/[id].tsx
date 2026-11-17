import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PriorityChip from '@/components/PriorityChip';
import PromoViewer from '@/components/PromoViewer';
import { cellOf, hallOfBooth, isSpecial } from '@/lib/boothId';
import { nextPriority, sortByPriority } from '@/lib/priority';
import { useHalls } from '@/store/halls';
import { useLinks } from '@/store/links';
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
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = raw ? decodeURIComponent(raw) : undefined;

  const { items, add, toggle, remove, update } = useShopping();
  const { remove: removeUpload } = useUploads();
  const { boothName, hallOf, setBoothName } = useHalls();
  const { linksOf, add: addLink, remove: removeLink, update: updateLink } = useLinks();

  const uploaded = useBoothUploads(id);
  const promos = useMemo(() => uploaded.map((u) => ({ uri: u.imageUri })), [uploaded]);
  const cover = promos[0];

  const mine = useMemo(
    () => sortByPriority(items.filter((it) => it.boothId === id), (x) => x.title),
    [items, id],
  );

  const [draft, setDraft] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const name = id ? boothName(id) : '';
  const hall = id ? hallOf(hallOfBooth(id) ?? '') : undefined;
  const links = id ? linksOf(id) : [];

  const submit = () => {
    if (!id || !draft.trim()) return;
    add(id, draft);
    setDraft('');
    buzz();
  };

  const submitLink = () => {
    if (!id || !linkUrl.trim()) return;
    addLink(id, linkTitle, linkUrl);
    setLinkTitle('');
    setLinkUrl('');
  };

  const confirmRemove = (itemId: string, title: string) => {
    Alert.alert('删除这一项？', title, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => remove(itemId) },
    ]);
  };

  const confirmDeleteUpload = (uploadId: string) => {
    Alert.alert('删除这张图？', '删除后图片文件也会一起清掉', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeUpload(uploadId) },
    ]);
  };

  if (!id) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>找不到这个摊位</Text>
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
          <View style={styles.headRow}>
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>{cellOf(id)}</Text>
            </View>
            {!!hall && <Text style={styles.hallText}>{hall.name}</Text>}
            {!isSpecial(id) && (
              <Pressable
                onPress={() => {
                  setNameDraft(name);
                  setEditingName(true);
                }}
                hitSlop={8}
                style={{ marginLeft: 'auto' }}
              >
                <Ionicons name="pencil" size={15} color="#B7AF9A" />
              </Pressable>
            )}
          </View>

          {editingName ? (
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              onSubmitEditing={() => {
                setBoothName(hall?.id ?? '', cellOf(id), nameDraft.trim());
                setEditingName(false);
              }}
              onBlur={() => {
                setBoothName(hall?.id ?? '', cellOf(id), nameDraft.trim());
                setEditingName(false);
              }}
              style={styles.nameInput}
              placeholder="摊位名"
              placeholderTextColor="#B0AB99"
            />
          ) : (
            <Text style={styles.title}>{name || '未命名摊位'}</Text>
          )}

          <Text style={styles.sub}>
            {mine.length === 0
              ? '还没标记要买的东西'
              : `要买 ${mine.length} 件 · 已买 ${mine.filter((i) => i.done).length} 件`}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>图片</Text>
        {cover ? (
          <Pressable style={styles.promoCard} onPress={() => setViewerOpen(true)}>
            <Image source={cover} style={styles.promoImage} resizeMode="contain" />
            <View style={styles.promoBadge}>
              <Ionicons name="expand-outline" size={12} color={theme.ink} />
              <Text style={styles.promoBadgeText}>
                {promos.length > 1 ? `${promos.length} 张 · 点开看` : '点开看大图'}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.promoEmpty}>
            <Ionicons name="image-outline" size={22} color="#BDB8A6" />
            <Text style={styles.promoEmptyText}>还没有图</Text>
          </View>
        )}

        <Pressable
          style={styles.actionRow}
          onPress={() => router.push({ pathname: '/upload', params: { booth: id } })}
        >
          <Ionicons name="add-circle-outline" size={16} color={theme.ink} />
          <Text style={styles.actionText}>上传图片</Text>
        </Pressable>

        {uploaded.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={styles.thumbRow}>
              {uploaded.map((u) => (
                <View key={u.id} style={styles.thumbWrap}>
                  <Image source={{ uri: u.imageUri }} style={styles.thumb} resizeMode="cover" />
                  <Pressable
                    onPress={() => router.push({ pathname: '/upload', params: { replace: u.id } })}
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
        )}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>链接</Text>
        {links.map((l) => (
          <View key={l.id} style={styles.linkRow}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => Linking.openURL(l.url).catch(() => {})}
            >
              <Text style={styles.linkTitle} numberOfLines={1}>
                {l.title}
              </Text>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {l.url}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setLinkTitle(l.title);
                setLinkUrl(l.url);
                updateLink(l.id, {});
              }}
              hitSlop={8}
              style={styles.rowIcon}
            >
              <Ionicons name="create-outline" size={14} color="#B7AF9A" />
            </Pressable>
            <Pressable onPress={() => removeLink(l.id)} hitSlop={8} style={styles.rowIcon}>
              <Ionicons name="close" size={15} color="#B79C92" />
            </Pressable>
          </View>
        ))}

        <View style={styles.linkForm}>
          <TextInput
            value={linkTitle}
            onChangeText={setLinkTitle}
            placeholder="名称，比如 摊位主页"
            placeholderTextColor="#B0AB99"
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="https://…"
            placeholderTextColor="#B0AB99"
            style={[styles.input, { flex: 1.4 }]}
            autoCapitalize="none"
          />
          <Pressable
            onPress={submitLink}
            disabled={!linkUrl.trim()}
            style={[styles.addBtn, !linkUrl.trim() && styles.addBtnOff]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>要买</Text>
        {mine.length === 0 ? (
          <Text style={styles.emptyText}>在下面加要买的东西</Text>
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
                style={styles.rowIcon}
              >
                <Ionicons name="create-outline" size={15} color="#B7AF9A" />
              </Pressable>
              <Pressable
                onPress={() => confirmRemove(it.id, it.title)}
                hitSlop={12}
                style={styles.rowIcon}
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
          placeholder="要买什么？"
          placeholderTextColor="#B0AB99"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={submit}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim()}
          style={[styles.addBtn, !draft.trim() && styles.addBtnOff]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <PromoViewer
        visible={viewerOpen}
        sources={promos}
        title={`${cellOf(id)} · ${name || '摊位'}`}
        boothId={id}
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
  head: { paddingHorizontal: 22, paddingTop: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, backgroundColor: theme.accent },
  idChipText: { ...typo.mono, color: theme.ink },
  hallText: { ...typo.small, color: theme.sub },
  title: { ...typo.h1, color: theme.ink, marginTop: 8 },
  nameInput: {
    marginTop: 8,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.ink,
    ...typo.h2,
    color: theme.ink,
  },
  sub: { ...typo.small, color: theme.sub, marginTop: 5 },
  body: { padding: 16, paddingTop: 12 },
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
    alignItems: 'center',
    gap: 8,
  },
  promoEmptyText: { ...typo.small, color: '#A29D8C' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
  },
  actionText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  thumbRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  linkTitle: { ...typo.body, color: theme.ink, fontWeight: '700' },
  linkUrl: { ...typo.small, color: theme.sub, marginTop: 2 },
  linkForm: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  emptyText: { ...typo.small, color: theme.sub, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  rowBody: { flex: 1, gap: 2 },
  rowText: { ...typo.body, color: theme.ink },
  rowNote: { ...typo.small, color: theme.sub, fontWeight: '500' },
  rowTextDone: { color: '#A9A493', textDecorationLine: 'line-through' },
  rowIcon: { padding: 4 },
  priceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: theme.accentSoft,
  },
  priceChipDone: { backgroundColor: '#EDEAE0' },
  priceText: { ...typo.mono, color: theme.ink },
  priceTextDone: { color: '#B4AF9D' },
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOff: { backgroundColor: '#C9C5B4' },
});
