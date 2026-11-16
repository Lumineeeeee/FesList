import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

import { useEvents } from '@/store/events';
import { theme, typo } from '@/theme';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, current, switchTo, create } = useEvents();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    create(name, date, venue);
    setName('');
    setDate('');
    setVenue('');
    router.back();
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
          <Text style={styles.title}>切换漫展</Text>
          <Text style={styles.sub}>每场漫展的清单和图片各自独立</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {events.map((e) => {
          const active = e.id === current.id;
          return (
            <Pressable
              key={e.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => {
                switchTo(e.id);
                router.back();
              }}
            >
              <View style={styles.rowBody}>
                <Text style={[styles.rowName, active && styles.rowNameActive]}>{e.name}</Text>
                {(!!e.date || !!e.venue) && (
                  <Text style={styles.rowMeta}>
                    {[e.date, e.venue].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              {active && <Ionicons name="checkmark-circle" size={18} color={theme.ink} />}
            </Pressable>
          );
        })}

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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    marginBottom: 8,
  },
  rowActive: { borderColor: theme.ink, backgroundColor: theme.accentSoft },
  rowBody: { flex: 1, gap: 3 },
  rowName: { ...typo.body, color: theme.ink, fontWeight: '700' },
  rowNameActive: { fontWeight: '800' },
  rowMeta: { ...typo.small, color: theme.sub },
  sectionLabel: { ...typo.mono, color: theme.sub, marginTop: 20, marginBottom: 8 },
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
  hint: { ...typo.small, color: '#A29D8C', marginTop: 10, lineHeight: 17 },
});
