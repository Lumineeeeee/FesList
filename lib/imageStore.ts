import * as FileSystem from 'expo-file-system/legacy';

const FOLDER = () => `${FileSystem.documentDirectory ?? ''}promo/`;

/** 存图片，返回一个可持久化的 key（手机上是文件路径） */
export async function saveImage(id: string, sourceUri: string): Promise<string> {
  if (!FileSystem.documentDirectory) return sourceUri;

  const folder = FOLDER();
  try {
    await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  } catch {
    // 已存在
  }

  const rawExt = sourceUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const ext = ['png', 'jpg', 'jpeg', 'webp'].includes(rawExt) ? rawExt : 'jpg';
  const dest = `${folder}${id}.${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

/** 把 key 变成可以直接给 <Image> 的地址 */
export async function loadImage(key: string): Promise<string> {
  return key;
}

export async function deleteImage(key: string): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await FileSystem.deleteAsync(key, { idempotent: true }).catch(() => {});
}
