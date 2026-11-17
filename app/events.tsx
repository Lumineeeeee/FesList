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

import { hallSignature, type Hall } from '@/data/halls';
import { exportInfo, exportItems, pickImport } from '@/lib/archive';
import { saveImageFromBase64 } from '@/lib/imageStore';
import { useEvents, type FestivalEvent } from '@/store/events';
import { useHalls } from '@/store/halls';
import { useLinks } from '@/store/links';
import { useShopping } from '@/store/shopping';
import { useUploads, type StoredUpload } from '@/store/uploads';
import { theme, typo } from '@/theme';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, current, switchTo, create } = useEvents();
  const { allItems, replaceAll: replaceItems } = useShopping();
  const { allUploads, replaceAll: replaceUploads } = useUploads();
  const { halls, replaceAll: replaceHalls } = useHalls();
  const { allLinks, replaceAll: replaceLinks } = useLinks();

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
    setBusy(`导出 ${e.name}…`);
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
      const links = allLinks.filter((l) => l.eventId === e.id);
      const isCurrent = e.id === current.id;
      const r = await exportInfo(e, uploads, isCurrent ? halls : [], links);
      Alert.alert('已导出', `${e.name}-信息.zip\n${r.images} 张图 · ${r.links} 个链接`);
    } catch (err) {
      Alert.alert('导出失败', String(err));
    } finally {
      setBusy('');
    }
  };

  const doExportItems = async (e: FestivalEvent) => {
    setBusy(`导出 ${e.name}…`);
    try {
      const r = await exportItems(
        e,
        allItems.filter((i) => i.eventId === e.id),
      );
      Alert.alert('已导出', `${e.name}-清单.json\n共 ${r.items} 条`);
    } catch (err) {
      Alert.alert('导出失败', String(err));
    } finally {
      setBusy('');
    }
  };

  const mergeInfo = async (
    info: { halls: Hall[]; images: unknown[]; links: { id: string; boothId: string; title: string; url: string }[] },
    images: { name: string; base64: string }[],
    mode: 'merge' | 'overwrite',
  ) => {
    setBusy('写入中…');
    try {
      if (mode === 'overwrite') {
        await replaceHalls(info.halls?.length ? info.halls : halls);
      }

      const meta = new Map(
        (info.images as { id: string; boothId: string; title: string; primary?: boolean; createdAt: number }[]).map(
          (i) => [i.id, i],
        ),
      );

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

      if (mode === 'merge') {
        const byId = new Map<string, StoredUpload>(others.map((u) => [u.id, u]));
        for (const u of allUploads.filter((x) => x.eventId === current.id)) {
          byId.set(u.id, {
            id: u.id,
            eventId: u.eventId,
            boothId: u.boothId,
            title: u.title,
            price: u.price,
            primary: u.primary,
            imageKey: u.imageKey,
            createdAt: u.createdAt,
          });
        }
        for (const u of imported) byId.set(u.id, u);
        await replaceUploads([...byId.values()]);
      } else {
        await replaceUploads([...others, ...imported]);
      }

      const incomingLinks = (info.links ?? []).map((l) => ({
        ...l,
        eventId: current.id,
      }));
      if (mode === 'merge') {
        const byId = new Map(allLinks.map((l) => [l.id, l]));
        for (const l of incomingLinks) byId.set(l.id, l);
        replaceLinks([...byId.values()]);
      } else {
        const othersl = allLinks.filter((l) => l.eventId !== current.id);
        replaceLinks([...othersl, ...incomingLinks]);
      }

      Alert.alert('完成', `${imported.length} 张图 · ${incomingLinks.length} 个链接`);
    } catch (err) {
      Alert.alert('导入失败', String(err));
    } finally {
      setBusy('');
    }
  };

  const mergeItems = (
    list: Omit<(typeof allItems)[number], 'eventId'>[],
    mode: 'merge' | 'overwrite',
  ) => {
    const others = allItems.filter((i) => i.eventId !== current.id);
    const currentItems = allItems.filter((i) => i.eventId === current.id);
    const incoming = list.map((i) => ({ ...i, eventId: current.id }));

    if (mode === 'overwrite') {
      replaceItems([...others, ...incoming]);
      return;
    }
    const byId = new Map(currentItems.map((i) => [i.id, i]));
    for (const i of incoming) byId.set(i.id, i);
    replaceItems([...others, ...byId.values()]);
  };

  const askMode = (
    title: string,
    canMerge: boolean,
    onPick: (mode: 'merge' | 'overwrite') => void,
  ) => {
    if (!canMerge) {
      Alert.alert(title, '这份文件与当前漫展的排布不一致，只能覆盖', [
        { text: '取消', style: 'cancel' },
        { text: '覆盖', style: 'destructive', onPress: () => onPick('overwrite') },
      ]);
      return;
    }
    Alert.alert(title, '融合：保留现有数据，把文件里的加进来（同 id 以文件为准）', [
      { text: '取消', style: 'cancel' },
      { text: '覆盖', style: 'destructive', onPress: () => onPick('overwrite') },
      { text: '融合', onPress: () => onPick('merge') },
    ]);
  };

  const doImport = async () => {
    try {
      const res = await pickImport();
      if (!res) return;

      if (res.kind === 'items') {
        const sameName = res.items.event.name.trim() === current.name.trim();
        askMode(`导入清单（${res.items.items.length} 条）`, sameName, (mode) =>
          mergeItems(res.items.items, mode),
        );
        return;
      }

      const sameName = res.info.event.name.trim() === current.name.trim();
      const sameLayout =
        !!res.info.halls?.length &&
        hallSignature(res.info.halls) === hallSignature(halls);
      const canMerge = sameName && sameLayout;

      askMode(
        `导入信息（${res.info.images?.length ?? 0} 张图 · ${res.info.links?.length ?? 0} 个链接）`,
        canMerge,
        (mode) => {
          void mergeInfo(res.info, res.images, mode);
        },
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

              <Pressable style={styles.smallBtn} onPress={() => doExportInfo(e)}>
                <Text style={styles.smallBtnText}>信息</Text>
              </Pressable>
              <Pressable style={styles.smallBtn} onPress={() => doExportItems(e)}>
                <Text style={styles.smallBtnText}>清单</Text>
              </Pressable>
              {active && <Ionicons name="checkmark-circle" size={18} color={theme.ink} />}
            </View>
          );
        })}

        <Pressable style={styles.importBtn} onPress={doImport} disabled={!!busy}>
          <Ionicons name="download-outline" size={16} color={theme.ink} />
          <Text style={styles.importText}>导入</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>新建漫展</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="漫展名称"
          placeholderTextColor="#B0AB99"
          style={styles.input}
        />
        <View style={styles.rowInputs}>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="日期"
            placeholderTextColor="#B0AB99"
            style={[styles.input, styles.half]}
          />
          <TextInput
            value={venue}
            onChangeText={setVenue}
            placeholder="场馆"
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
  body: { padding: 16, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  smallBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.accentSoft,
  },
  smallBtnText: { ...typo.small, color: theme.ink, fontWeight: '800' },
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
  importText: { ...typo.body, color: theme.ink, fontWeight: '800' },
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
