import { Linking, Platform } from 'react-native';

/** 补全协议：foobar.com → https://foobar.com */
export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return v;
  if (v.startsWith('mailto:') || v.startsWith('tel:')) return v;
  return `https://${v}`;
}

/** 打开外链：web 新标签页，原生用系统浏览器 */
export async function openUrl(raw: string): Promise<boolean> {
  const url = normalizeUrl(raw);
  if (!url) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) return true;
    window.location.href = url;
    return true;
  }

  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
