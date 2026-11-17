import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { useHalls } from '@/store/halls';
import { theme, typo } from '@/theme';

const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function HallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { halls, currentHall, setCurrentHall, addHall, removeHall, renameHall, setLayout } =
    useHalls();

  const [newName, setNewName] = useState('');
  const [rows, setRows] = useState(currentHall.rows.length);
  const [cols, setCols] = useState(currentHall.cols);
  const [nameDraft, setNameDraft] = useState(currentHall.name);

  const applyLayout = () => {
    const r = Math.max(1, Math.min(ROW_LETTERS.length, rows));
    const c = Math.max(1, Math.min(12, cols));
    setLayout(currentHall.id, ROW_LETTERS.slice(0, r), c);
  };

  const confirmRemove = () => {
    if (halls.length <= 1) return;
    Alert.alert('删除这个馆？', currentHall.name, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeHall(currentHall.id) },
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
          <Text style={styles.title}>馆与排布</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          {halls.map((h) => {
            const active = h.id === currentHall.id;
            return (
              <Pressable
                key={h.id}
                onPress={() => {
                  setCurrentHall(h.id);
                  setRows(h.rows.length);
                  setCols(h.cols);
                  setNameDraft(h.name);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{h.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>馆名</Text>
        <TextInput
          key={`${currentHall.id}-name`}
          value={nameDraft}
          onChangeText={setNameDraft}
          onBlur={() => renameHall(currentHall.id, nameDraft.trim() || currentHall.name)}
          style={styles.input}
          placeholder="4 号馆"
          placeholderTextColor="#B0AB99"
        />

        <Text style={styles.label}>排布</Text>
        <View style={styles.rowInputs}>
          <View style={styles.half}>
            <Text style={styles.sub}>行数（A 起）</Text>
            <TextInput
              key={`${currentHall.id}-rows`}
              defaultValue={String(currentHall.rows.length)}
              keyboardType="number-pad"
              onChangeText={(v) => setRows(Number(v.replace(/\D/g, '')) || 1)}
              onBlur={applyLayout}
              style={styles.input}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.sub}>列数</Text>
            <TextInput
              key={`${currentHall.id}-cols`}
              defaultValue={String(currentHall.cols)}
              keyboardType="number-pad"
              onChangeText={(v) => setCols(Number(v.replace(/\D/g, '')) || 1)}
              onBlur={applyLayout}
              style={styles.input}
            />
          </View>
        </View>

        <Pressable style={styles.applyBtn} onPress={applyLayout}>
          <Text style={styles.applyText}>应用排布</Text>
        </Pressable>

        <Text style={styles.label}>新建馆</Text>
        <View style={styles.rowInputs}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="5 号馆"
            placeholderTextColor="#B0AB99"
            style={[styles.input, { flex: 1 }]}
          />
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              addHall(newName);
              setNewName('');
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {halls.length > 1 && (
          <Pressable style={styles.delBtn} onPress={confirmRemove}>
            <Ionicons name="trash-outline" size={15} color={theme.danger} />
            <Text style={styles.delText}>删除当前馆</Text>
          </Pressable>
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
  body: { padding: 16, paddingBottom: 30 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  chipActive: { backgroundColor: theme.ink, borderColor: theme.ink },
  chipText: { ...typo.small, color: theme.sub, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  label: { ...typo.mono, color: theme.sub, marginTop: 18, marginBottom: 6 },
  sub: { ...typo.small, color: '#A29D8C', marginBottom: 4 },
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
  rowInputs: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  half: { flex: 1 },
  applyBtn: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
  },
  applyText: { ...typo.small, color: theme.ink, fontWeight: '800' },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 26,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6C9C2',
    backgroundColor: '#FBF1EE',
  },
  delText: { ...typo.body, color: theme.danger, fontWeight: '700' },
});
