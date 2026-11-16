import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { readImageBase64 } from '@/lib/imageStore';
import {
  DEFAULT_SYNC,
  loadSyncConfig,
  pullSnapshot,
  pushSnapshot,
  saveSyncConfig,
  type SyncConfig,
} from '@/lib/sync';
import { useEvents } from '@/store/events';
import { useShopping } from '@/store/shopping';
import { useUploads } from '@/store/uploads';
import { theme, typo } from '@/theme';

export default function SyncScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, current, replaceAll: replaceEvents } = useEvents();
  const { allItems, replaceAll: replaceItems } = useShopping();
  const { allUploads, replaceAll: replaceUploads } = useUploads();

  const [cfg, setCfg] = useState<SyncConfig>(DEFAULT_SYNC);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSyncConfig().then(setCfg);
  }, []);

  const persistCfg = async (next: SyncConfig) => {
    setCfg(next);
    await saveSyncConfig(next);
  };

  const push = async () => {
    setBusy(true);
    setStatus('准备上传…');
    try {
      const result = await pushSnapshot(
        cfg,
        {
          events,
          currentEventId: current.id,
          items: allItems,
          uploads: allUploads.map((u) => ({
            id: u.id,
            eventId: u.eventId,
            boothId: u.boothId,
            title: u.title,
            price: u.price,
            primary: u.primary,
            imageKey: u.imageKey,
            createdAt: u.createdAt,
          })),
        },
        readImageBase64,
        (done, total) => setStatus(`上传图片 ${done}/${total}`),
      );
      setStatus(`已上传：${events.length} 场 · ${allItems.length} 项 · ${result.images} 张新图`);
    } catch (e) {
      setStatus(`上传失败：${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const pull = () => {
    Alert.alert('从服务器恢复？', '会用服务器上的数据覆盖这台设备当前的数据', [
      { text: '取消', style: 'cancel' },
      {
        text: '覆盖',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setStatus('读取中…');
          try {
            const snap = await pullSnapshot(cfg);
            if (!snap) {
              setStatus('服务器上还没有数据');
              return;
            }
            replaceEvents(snap.events, snap.currentEventId);
            replaceItems(snap.items);
            await replaceUploads(snap.uploads);
            setStatus(
              `已恢复：${snap.events.length} 场 · ${snap.items.length} 项 · ${snap.uploads.length} 张图`,
            );
          } catch (e) {
            setStatus(`恢复失败：${String(e)}`);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
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
          <Text style={styles.title}>同步</Text>
          <Text style={styles.sub}>把清单和图片备份到自己的服务器</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>服务器地址</Text>
        <TextInput
          value={cfg.url}
          onChangeText={(v) => setCfg({ ...cfg, url: v })}
          onBlur={() => persistCfg(cfg)}
          placeholder="http://47.116.101.152:8080"
          placeholderTextColor="#B0AB99"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>访问 token</Text>
        <TextInput
          value={cfg.token}
          onChangeText={(v) => setCfg({ ...cfg, token: v })}
          onBlur={() => persistCfg(cfg)}
          placeholder="服务器上的 token.txt"
          placeholderTextColor="#B0AB99"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable style={styles.saveBtn} onPress={() => persistCfg(cfg)}>
          <Text style={styles.saveBtnText}>保存设置</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            style={[styles.action, busy && styles.actionDisabled]}
            onPress={push}
            disabled={busy}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>上传到服务器</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.actionGhost, busy && styles.actionDisabled]}
            onPress={pull}
            disabled={busy}
          >
            <Ionicons name="cloud-download-outline" size={18} color={theme.ink} />
            <Text style={[styles.actionText, { color: theme.ink }]}>从服务器恢复</Text>
          </Pressable>
        </View>

        {busy && <ActivityIndicator style={{ marginTop: 16 }} color={theme.ink} />}
        {!!status && <Text style={styles.status}>{status}</Text>}

        <Text style={styles.hint}>
          上传是整份数据覆盖服务器；恢复是整份数据覆盖本机。图片按记录 id 命名，重复上传不会重复占空间。
        </Text>
        <Text style={styles.hint}>
          当前：{events.length} 场漫展 · {allItems.length} 条清单 · {allUploads.length} 张图
        </Text>
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
  label: { ...typo.mono, color: theme.sub, marginTop: 14, marginBottom: 6 },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    ...typo.body,
    color: theme.ink,
  },
  saveBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { ...typo.body, color: theme.ink, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.ink,
  },
  actionGhost: { backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.line },
  actionDisabled: { opacity: 0.5 },
  actionText: { ...typo.body, color: '#FFFFFF', fontWeight: '800' },
  status: { ...typo.small, color: theme.ink, marginTop: 14, lineHeight: 18 },
  hint: { ...typo.small, color: '#A29D8C', marginTop: 14, lineHeight: 18 },
});
