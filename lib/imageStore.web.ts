/**
 * Web 端：用浏览器的 IndexedDB 存图片二进制。
 * 不依赖任何库，刷新页面也还在（localStorage 只有 5MB，装不下图）。
 */

const DB_NAME = 'fes-list-images';
const STORE = 'images';
const PREFIX = 'idb:';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function put(db: IDBDatabase, key: string, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function get(db: IDBDatabase, key: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function drop(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveImage(id: string, sourceUri: string): Promise<string> {
  const res = await fetch(sourceUri);
  const blob = await res.blob();
  const db = await openDb();
  await put(db, id, blob);
  db.close();
  return `${PREFIX}${id}`;
}

export async function loadImage(key: string): Promise<string> {
  if (!key.startsWith(PREFIX)) return key;
  const db = await openDb();
  const blob = await get(db, key.slice(PREFIX.length));
  db.close();
  return blob ? URL.createObjectURL(blob) : '';
}

export async function deleteImage(key: string): Promise<void> {
  if (!key.startsWith(PREFIX)) return;
  const db = await openDb();
  await drop(db, key.slice(PREFIX.length)).catch(() => {});
  db.close();
}

/** 读成 base64，用于上传到服务器；远程地址或读不到时返回 null */
export async function readImageBase64(key: string): Promise<string | null> {
  if (!key.startsWith(PREFIX)) return null;
  const db = await openDb();
  const blob = await get(db, key.slice(PREFIX.length)).catch(() => null);
  db.close();
  if (!blob) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const comma = raw.indexOf(',');
      resolve(comma >= 0 ? raw.slice(comma + 1) : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
