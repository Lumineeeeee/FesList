import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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

import { BOOTH_BY_ID } from '@/data/booths';
import { normalizeBooth, normalizePrice } from '@/lib/boothInput';
import { promoNoun } from '@/lib/promoLabel';
import { useShopping } from '@/store/shopping';
import { useUploads } from '@/store/uploads';
import { theme, typo } from '@/theme';

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ booth?: string; mode?: string; replace?: string }>();
  const { add, replace: replaceUpload, uploads } = useUploads();
  const { add: addItem } = useShopping();

  const isItemMode = params.mode === 'item';
  const replaceId = typeof params.replace === 'string' ? params.replace : '';
  const isReplace = replaceId.length > 0;
  const presetBooth = typeof params.booth === 'string' ? params.booth : '';
  const replaceTarget = isReplace ? uploads.find((u) => u.id === replaceId) : undefined;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [booth, setBooth] = useState(presetBooth);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Web：直接 Ctrl+V 粘图
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const onPaste = (event: Event) => {
      const clipboardEvent = event as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => setImageUri(String(reader.result));
        reader.readAsDataURL(file);
        clipboardEvent.preventDefault();
        break;
      }
    };

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  const boothId = useMemo(() => normalizeBooth(booth), [booth]);
  const boothName = boothId ? BOOTH_BY_ID.get(boothId)?.name : undefined;
  const isMap = boothId === 'MAP';
  const noun = promoNoun(boothId ?? replaceTarget?.boothId);
  const boothInvalid = booth.trim().length > 0 && !boothId;
  const canSave = isReplace
    ? !!imageUri && !saving
    : (isItemMode || !!imageUri) && !!boothId && title.trim().length > 0 && !saving;

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
    }
  };

  const pasteImage = async () => {
    try {
      // 只在按下时才加载，Web 端根本不引这个模块
      const Clipboard = await import('expo-clipboard');
      const image = await Clipboard.getImageAsync({ format: 'jpeg' });
      if (!image?.data) {
        Alert.alert('剪贴板里没有图片', '先复制一张图，再点这里');
        return;
      }
      // data 已经带 data:image/jpeg;base64, 前缀
      setImageUri(image.data);
    } catch {
      Alert.alert('粘贴失败', '这台设备读不了剪贴板图片，用「选图」吧');
    }
  };

  const save = async () => {
    if (isReplace) {
      if (!imageUri) return;
      setSaving(true);
      try {
        await replaceUpload(replaceId, imageUri);
        router.back();
      } catch (e) {
        setSaving(false);
        Alert.alert('更换失败', String(e));
      }
      return;
    }

    if (!canSave || !boothId) return;
    setSaving(true);
    try {
      const cleanPrice = normalizePrice(price);
      if (!isItemMode && imageUri) {
        await add({ boothId, title: title.trim(), price: cleanPrice, imageUri });
      }
      // 地图只是图，不进购物清单
      if (!isMap) addItem(boothId, title.trim(), cleanPrice);
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert('保存失败', String(e));
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
          <Text style={styles.title}>
            {isReplace ? `更换${noun.one}` : isItemMode ? '添加清单' : `上传${noun.one}`}
          </Text>
          <Text style={styles.sub}>
            {isReplace
              ? '重新选一张图替换掉原来那张'
              : isItemMode
                ? '摊位 + 名称 + 价格，存进清单'
                : `图片 + 摊位 + 名称${isMap ? '' : ' + 价格'}，保存后会自动进清单`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!isItemMode && (
          <>
            <Pressable style={styles.picker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.pickerEmpty}>
              <Ionicons name="image-outline" size={30} color="#B0AB99" />
              <Text style={styles.pickerText}>
                {Platform.OS === 'web' ? '点这里选图，或直接 Ctrl+V 粘贴' : '点这里选图'}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.actions}>
          {imageUri && (
            <Pressable onPress={pickImage} style={styles.actionBtn}>
              <Ionicons name="refresh-outline" size={13} color={theme.sub} />
              <Text style={styles.actionText}>换一张</Text>
            </Pressable>
          )}
          {Platform.OS !== 'web' && (
            <Pressable onPress={pasteImage} style={styles.actionBtn}>
              <Ionicons name="clipboard-outline" size={13} color={theme.sub} />
              <Text style={styles.actionText}>粘贴</Text>
            </Pressable>
          )}
        </View>
          </>
        )}

        {!isReplace && (
          <>
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
              : '大小写都行，比如 a5 会补成 A05'}
        </Text>

        <Field label={isMap ? '地图名称' : '名称'}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={isMap ? '4 号馆' : '蕾米立牌'}
            placeholderTextColor="#B0AB99"
            style={styles.input}
          />
        </Field>

        {!isMap && (
          <>
            <Field label="价格">
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="35 / ¥35 / 无料"
                placeholderTextColor="#B0AB99"
                style={styles.input}
              />
            </Field>
            <Text style={styles.hint}>只填数字会自动加 ¥；留空就不显示价格</Text>
          </>
        )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>{saving ? '保存中…' : '保存'}</Text>
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
  picker: {
    height: 220,
    borderRadius: 16,
    backgroundColor: '#E9E6DA',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CFCBB9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerEmpty: { alignItems: 'center', gap: 6, paddingHorizontal: 24 },
  pickerText: { ...typo.small, color: '#A29D8C', textAlign: 'center' },
  preview: { width: '100%', height: '100%' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { ...typo.small, color: theme.sub },
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
