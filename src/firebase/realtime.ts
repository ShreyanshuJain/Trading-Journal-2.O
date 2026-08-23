import {
  DataSnapshot,
  get as rtdbGet,
  onValue as rtdbOnValue,
  ref as rtdbRef,
  remove as rtdbRemove,
  set as rtdbSet,
} from 'firebase/database';
import { db } from './config';

type PathRef<K extends 'collection' | 'doc'> = { path: string; kind: K };

type DocumentSnapshot = {
  id: string;
  ref: PathRef<'doc'>;
  data: () => Record<string, unknown>;
};

export type CollectionSnapshot = {
  docs: DocumentSnapshot[];
  empty: boolean;
};

export type DocumentDataSnapshot = {
  exists: () => boolean;
  data: () => Record<string, unknown>;
};

function joinPath(parts: string[]) {
  return parts.filter(Boolean).join('/');
}

export function collection(_database: typeof db, ...parts: string[]): PathRef<'collection'> {
  return { path: joinPath(parts), kind: 'collection' };
}

export function doc(_database: typeof db, ...parts: string[]): PathRef<'doc'> {
  return { path: joinPath(parts), kind: 'doc' };
}

function getLocalKey(path: string) {
  return `tj_store_${path}`;
}

function getLocalValue(path: string) {
  try {
    const raw = localStorage.getItem(getLocalKey(path));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalValue(path: string, val: unknown) {
  try {
    localStorage.setItem(getLocalKey(path), JSON.stringify(val));
  } catch {
    // ignore
  }
}

function removeLocalValue(path: string) {
  try {
    localStorage.removeItem(getLocalKey(path));
  } catch {
    // ignore
  }
}

function toCollectionSnapshot(value: Record<string, Record<string, unknown>> | null, path: string): CollectionSnapshot {
  const docs = value
    ? Object.entries(value).map(([id, data]) => ({
        id,
        ref: { path: `${path}/${id}`, kind: 'doc' as const },
        data: () => data || {},
      }))
    : [];

  return { docs, empty: docs.length === 0 };
}

const listeners = new Map<string, Set<() => void>>();

function notifyListeners(path: string) {
  // Notify exact doc path listeners
  const docSet = listeners.get(path);
  if (docSet) {
    docSet.forEach((cb) => cb());
  }

  // Notify parent collection path listeners
  const pathParts = path.split('/');
  if (pathParts.length > 1) {
    const parentPath = pathParts.slice(0, -1).join('/');
    const parentSet = listeners.get(parentPath);
    if (parentSet) {
      parentSet.forEach((cb) => cb());
    }
  }
}

export function onSnapshot(
  target: PathRef<'collection'>,
  callback: (snapshot: CollectionSnapshot) => void,
  onError?: (error: Error) => void,
): () => void;
export function onSnapshot(
  target: PathRef<'doc'>,
  callback: (snapshot: DocumentDataSnapshot) => void,
  onError?: (error: Error) => void,
): () => void;
export function onSnapshot(
  target: PathRef<'collection' | 'doc'>,
  callback: (snapshot: any) => void,
  onError?: (error: Error) => void,
) {
  let isUnsubscribed = false;

  const emitLocal = () => {
    if (isUnsubscribed) return;
    const local = getLocalValue(target.path);
    if (target.kind === 'doc') {
      callback({
        exists: () => local !== null,
        data: () => (local || {}) as Record<string, unknown>,
      });
    } else {
      callback(toCollectionSnapshot(local, target.path));
    }
  };

  // Register in local in-memory listeners
  if (!listeners.has(target.path)) {
    listeners.set(target.path, new Set());
  }
  const listenerCb = () => emitLocal();
  listeners.get(target.path)!.add(listenerCb);

  // Emit initial local state immediately so UI is populated with zero delay
  emitLocal();

  try {
    const unsub = rtdbOnValue(
      rtdbRef(db, target.path),
      (snapshot) => {
        if (isUnsubscribed) return;
        if (target.kind === 'doc') {
          const val = snapshot.val();
          if (val) setLocalValue(target.path, val);
          callback({
            exists: () => snapshot.exists(),
            data: () => (snapshot.val() || getLocalValue(target.path) || {}) as Record<string, unknown>,
          });
        } else {
          const val = snapshot.val();
          if (val) setLocalValue(target.path, val);
          callback(toCollectionSnapshot(val || getLocalValue(target.path), target.path));
        }
      },
      (error) => {
        if (isUnsubscribed) return;
        console.warn(`[RTDB listener notice for ${target.path}]:`, error.message);
        emitLocal();
        if (onError) onError(error);
      },
    );

    return () => {
      isUnsubscribed = true;
      unsub();
      listeners.get(target.path)?.delete(listenerCb);
    };
  } catch (err: any) {
    emitLocal();
    return () => {
      isUnsubscribed = true;
      listeners.get(target.path)?.delete(listenerCb);
    };
  }
}

export async function setDoc(target: PathRef<'doc'>, value: unknown, options?: { merge?: boolean }) {
  let nextValue = value as Record<string, unknown>;
  const pathParts = target.path.split('/');
  const docId = pathParts[pathParts.length - 1];
  const collectionPath = pathParts.slice(0, -1).join('/');

  try {
    if (options?.merge) {
      const currentSnap = await rtdbGet(rtdbRef(db, target.path));
      const current = currentSnap.val() || getLocalValue(target.path);
      nextValue = { ...(current || {}), ...(value as Record<string, unknown>) };
    }
    await rtdbSet(rtdbRef(db, target.path), nextValue);
  } catch (err) {
    console.warn('[RTDB setDoc using local fallback]:', err);
    if (options?.merge) {
      const current = getLocalValue(target.path);
      nextValue = { ...(current || {}), ...(value as Record<string, unknown>) };
    }
  }

  // Update local cache & notify all active component listeners instantly
  setLocalValue(target.path, nextValue);
  if (collectionPath) {
    const colVal = getLocalValue(collectionPath) || {};
    colVal[docId] = nextValue;
    setLocalValue(collectionPath, colVal);
  }
  notifyListeners(target.path);
}

export async function deleteDoc(target: PathRef<'doc'>) {
  const pathParts = target.path.split('/');
  const docId = pathParts[pathParts.length - 1];
  const collectionPath = pathParts.slice(0, -1).join('/');

  try {
    await rtdbRemove(rtdbRef(db, target.path));
  } catch (err) {
    console.warn('[RTDB deleteDoc using local fallback]:', err);
  }

  removeLocalValue(target.path);
  if (collectionPath) {
    const colVal = getLocalValue(collectionPath) || {};
    delete colVal[docId];
    setLocalValue(collectionPath, colVal);
  }
  notifyListeners(target.path);
}

export async function getDocs(target: PathRef<'collection'>): Promise<CollectionSnapshot> {
  try {
    const snapshot = await rtdbGet(rtdbRef(db, target.path));
    const val = snapshot.val() || getLocalValue(target.path);
    return toCollectionSnapshot(val, target.path);
  } catch {
    return toCollectionSnapshot(getLocalValue(target.path), target.path);
  }
}