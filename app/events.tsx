import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { exportInfo, exportItems, pickImport } from '@/lib/archive';
import { saveImageFromBase64 } from '@/lib/imageStore';
import { useEvents, type FestivalEvent } from '@/store/events';
import { useShopping } from '@/store/shopping';
import { useUploads, type StoredUpload } from '@/store/uploads';
import { theme, typo } from '@/theme';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, current, switchTo, create } = useEvents();
  const { allItems, replaceAll: replaceItems } = useShopping();
  const { allUploads, replaceAll: replaceUploads } = useUploads();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [busy, setBusy] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    create(name, date, venue);
    setName('');
    setDate('');
    setVenue('');
    router.back();
  };

  const doExportInfo = async (e: FestivalEvent) => {
    setBusy(`导出 ${e.name} 的图…`);
    try {
      const uploads: StoredUpload[] = allUploads
        .filter((u) => u.eventId === e.id)
        .map((u) => ({
          id: u.id,
          eventId: u.eventId,
          boothId: u.boothId,
          title: u.title,
          price: u.price,
          primary: u.primary,
          imageKey: u.imageKey,
          createdAt: u.createdAt,
        }));
      const r = await exportInfo(e, uploads);
      Alert.alert('已导出', `${e.name}-信息.zip\n含 ${r.images} 张图`);
    } catch (err) {
      Alert.alert('导出失败', String(err));
    } finally {
      setBusy('');
    }
  };

  const doExportItems = async (e: FestivalEvent) => {
    setBusy(`导出 ${e.name} 的清单…`);
    try {
      const items = allItems.filter((i) => i.eventId === e.id);
      const r = await exportItems(e, items);
      Alert.alert('已导出', `${e.name}-清单.json\n共 ${r.items} 条`);
    } catch (err) {
      Alert.alert('导出失败', String(err));
    } finally {
      setBusy('');
    }
  };

  const applyItems = (list: Omit<(typeof allItems)[number], 'eventId'>[]) => {
    const others = allItems.filter((i) => i.eventId !== current.id);
    replaceItems([...others, ...list.map((i) => ({ ...i, eventId: current.id }))]);
  };

  const applyInfo = async (
    info: {
      images: {
        id: string;
        boothId: string;
        title: string;
        primary?: boolean;
        createdAt: number;
      }[];
    },
    images: { name: string; base64: string }[],
  ) => {
    const meta = new Map(info.images.map((i) => [i.id, i]));
    const imported: StoredUpload[] = [];

    for (const img of images) {
      const m = meta.get(img.name);
      if (!m) continue;
      const imageKey = await saveImageFromBase64(img.name, img.base64);
      imported.push({
        id: img.name,
        eventId: current.id,
        boothId: m.boothId,
        title: m.title,
        primary: m.primary,
        imageKey,
        createdAt: m.createdAt,
      });
    }

    const others = allUploads
      .filter((u) => u.eventId !== current.id)
      .map((u) => ({
        id: u.id,
        eventId: u.eventId,
        boothId: u.boothId,
        title: u.title,
        price: u.price,
        primary: u.primary,
        imageKey: u.imageKey,
        createdAt: u.createdAt,
      }));

    await replaceUploads([...others, ...imported]);
  };

  const doImport = async () => {
    try {
      const res = await pickImport();
      if (!res) return;

      if (res.kind === 'items') {
        const count = res.items.items.length;
        Alert.alert(
          '导入清单？',
          `会把 ${count} 条写进当前漫展「${current.name}」，原有清单被覆盖`,
          [
            { text: '取消', style: 'cancel' },
            { text: '导入', style: 'destructive', onPress: () => applyItems(res.items.items) },
          ],
        );
        return;
      }

      const count = res.info.images.length;
      Alert.alert(
        '导入图片？',
        `会把 ${count} 张图写进当前漫展「${current.name}」，原有图片被覆盖`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '导入',
            style: 'destructive',
            onPress: async () => {
              setBusy('写入图片…');
              try {
                await applyInfo(res.info, res.images);
                Alert.alert('已导入', `${count} 张图`);
              } catch (err) {
                Alert.alert('导入失败', String(err));
              } finally {
                setBusy('');
              }
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert('导入失败', String(err));
    }
  };

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
          <Text style={styles.title}>漫展</Text>
          <Text style={styles.sub}>每场漫展的清单和图片各自独立，可导出/导入</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {events.map((e) => {
          const active = e.id === current.id;
          return (
            <View key={e.id} style={[styles.row, active && styles.rowActive]}>
              <Pressable
                style={styles.rowMain}
                onPress={() => {
                  switchTo(e.id);
                  router.back();
                }}
              >
                <Text style={[styles.rowName, active && styles.rowNameActive]} numberOfLines={1}>
                  {e.name}
                </Text>
                {(!!e.date || !!e.venue) && (
                  <Text style={styles.rowMeta}>{[e.date, e.venue].filter(Boolean).join(' · ')}</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => doExportInfo(e)}
                hitSlop={6}
                style={styles.miniBtn}
                accessibilityLabel={`导出 ${e.name} 的信息`}
              >
                <Ionicons name="images-outline" size={16} color={theme.sub} />
              </Pressable>
              <Pressable
                onPress={() => doExportItems(e)}
                hitSlop={6}
                style={styles.miniBtn}
                accessibilityLabel={`导出 ${e.name} 的清单`}
              >
                <Ionicons name="list-outline" size={16} color={theme.sub} />
              </Pressable>
              {active && <Ionicons name="checkmark-circle" size={18} color={theme.ink} />}
            </View>
          );
        })}

        <Pressable style={styles.importBtn} onPress={doImport} disabled={!!busy}>
          <Ionicons name="download-outline" size={16} color={theme.ink} />
          <Text style={styles.importText}>导入 信息.zip / 清单.json</Text>
        </Pressable>

        <Text style={styles.hint}>
          每行右侧两个图标：左边「图片」导出 zip（含所有图），右边「清单」导出 json。
          导入会覆盖当前漫展「{current.name}」对应的那一部分。
        </Text>

        <Text style={styles.sectionLabel}>新建漫展</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="漫展名称，比如 CPT-F 2026"
          placeholderTextColor="#B0AB99"
          style={styles.input}
        />
        <View style={styles.rowInputs}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="日期（可选）"
            placeholderTextColor="#B0AB99"
            style={[styles.input, styles.half]}
          />
          <TextInput
            value={venue}
            onChangeText={setVenue}
            placeholder="场馆（可选）"
            placeholderTextColor="#B0AB99"
            style={[styles.input, styles.half]}
          />
        </View>

        <Pressable
          onPress={submit}
          disabled={!name.trim()}
          style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
        >
          <Text style={styles.createBtnText}>新建并切换</Text>
        </Pressable>
        <Text style={styles.hint}>新建的漫展是空白的，摊位号沿用 A01–D09 / OFF / MAP。</Text>

        {!!busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator color={theme.ink} />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        )}
      </ScrollView>
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
  title: { ...typo.h1, color: theme.ink },
  sub: { ...typo.small, color: theme.sub, marginTop: 5 },
  body: { padding: 16, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    marginBottom: 8,
  },
  rowActive: { borderColor: theme.ink, backgroundColor: theme.accentSoft },
  rowMain: { flex: 1, gap: 3, paddingVertical: 2 },
  rowName: { ...typo.body, color: theme.ink, fontWeight: '700' },
  rowNameActive: { fontWeight: '800' },
  rowMeta: { ...typo.small, color: theme.sub },
  miniBtn: { padding: 6 },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.line,
  },
  importText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  hint: { ...typo.small, color: '#A29D8C', marginTop: 10, lineHeight: 17 },
  sectionLabel: { ...typo.mono, color: theme.sub, marginTop: 22, marginBottom: 8 },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    ...typo.body,
    color: theme.ink,
    marginBottom: 8,
  },
  rowInputs: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  createBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: { backgroundColor: '#C9C5B4' },
  createBtnText: { ...typo.body, color: '#FFFFFF', fontWeight: '800' },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  busyText: { ...typo.small, color: theme.sub },
});
