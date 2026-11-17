import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
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

import { PRIORITY_META, PRIORITY_ORDER, type Priority } from '@/data/items';
import { normalizeBooth, normalizePrice } from '@/lib/boothInput';
import { cellOf, hallOfBooth } from '@/lib/boothId';
import { useHalls } from '@/store/halls';
import { useShopping } from '@/store/shopping';
import { theme, typo } from '@/theme';

export default function EditItemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    boothId?: string;
    title?: string;
    price?: string;
    priority?: string;
  }>();
  const { update, remove } = useShopping();
  const { boothName: nameOf } = useHalls();

  const itemId = typeof params.id === 'string' ? params.id : '';
  const originalBooth = typeof params.boothId === 'string' ? params.boothId : '';
  const [booth, setBooth] = useState(originalBooth ? cellOf(originalBooth) : '');
  const [title, setTitle] = useState(typeof params.title === 'string' ? params.title : '');
  const [price, setPrice] = useState(typeof params.price === 'string' ? params.price : '');
  const [priority, setPriority] = useState<Priority>(
    params.priority === 'high' || params.priority === 'low' || params.priority === 'mid'
      ? params.priority
      : 'mid',
  );

  const boothId = useMemo(
    () => normalizeBooth(booth, hallOfBooth(originalBooth) ?? undefined),
    [booth, originalBooth],
  );
  const boothName = boothId ? nameOf(boothId) : undefined;
  const boothInvalid = booth.trim().length > 0 && !boothId;
  const canSave = !!itemId && !!boothId && title.trim().length > 0;

  const save = () => {
    if (!canSave || !boothId) return;
    update(itemId, {
      boothId,
      title: title.trim(),
      price: normalizePrice(price),
      priority,
    });
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert('删除这一项？', title, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          remove(itemId);
          router.back();
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
          <Text style={styles.title}>修改清单</Text>
          <Text style={styles.sub}>摊位、名称、价格都能改</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="摊位">
          <TextInput
            value={booth}
            onChangeText={setBooth}
            placeholder="A05 / b09 / OFF"
            placeholderTextColor="#B0AB99"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </Field>
        <Text style={[styles.hint, boothInvalid && styles.hintBad]}>
          {boothInvalid
            ? '认不出这个摊位号，格式是 A01–D09 或 OFF'
            : boothId
              ? `${boothId}${boothName ? ` · ${boothName}` : ''}`
              : '大小写都行'}
        </Text>

        <Field label="名称">
          <TextInput value={title} onChangeText={setTitle} style={styles.input} />
        </Field>

        <Field label="价格">
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="35 / ¥35 / 无料"
            placeholderTextColor="#B0AB99"
            style={styles.input}
          />
        </Field>
        <Text style={styles.hint}>留空就不显示价格</Text>

        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>优先级</Text>
        <View style={styles.seg}>
          {PRIORITY_ORDER.map((p) => {
            const meta = PRIORITY_META[p];
            const active = priority === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.segItem,
                  active && { backgroundColor: meta.bg, borderColor: meta.fg },
                ]}
              >
                <Text style={[styles.segText, active && { color: meta.fg, fontWeight: '800' }]}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={15} color={theme.danger} />
          <Text style={styles.deleteText}>删除这一项</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>保存</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
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
  body: { padding: 16, paddingBottom: 24 },
  field: { marginTop: 18 },
  fieldLabel: { ...typo.mono, color: theme.sub, marginBottom: 6 },
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
  hint: { ...typo.small, color: '#A29D8C', marginTop: 6, fontWeight: '500' },
  hintBad: { color: theme.danger },
  seg: { flexDirection: 'row', gap: 8 },
  segItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    alignItems: 'center',
  },
  segText: { ...typo.small, color: theme.sub, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6C9C2',
    backgroundColor: '#FBF1EE',
  },
  deleteText: { ...typo.body, color: theme.danger, fontWeight: '700' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: theme.card,
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#C9C5B4' },
  saveBtnText: { ...typo.body, color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
