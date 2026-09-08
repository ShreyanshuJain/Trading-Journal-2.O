import {
  collection as fsCollection,
  doc as fsDoc,
  onSnapshot as fsOnSnapshot,
  setDoc as fsSetDoc,
  deleteDoc as fsDeleteDoc,
  getDocs as fsGetDocs,
  DocumentData,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './config';

type PathRef<K extends 'collection' | 'doc'> = {
  path: string;
  kind: K;
  fsRef: K extends 'collection' ? CollectionReference<DocumentData> : DocumentReference<DocumentData>;
};

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
  const path = joinPath(parts);
  return {
    path,
    kind: 'collection',
    fsRef: fsCollection(db, path),
  };
}

export function doc(_database: typeof db, ...parts: string[]): PathRef<'doc'> {
  const path = joinPath(parts);
  return {
    path,
    kind: 'doc',
    fsRef: fsDoc(db, path),
  };
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
        ref: { path: `${path}/${id}`, kind: 'doc' as const, fsRef: fsDoc(db, `${path}/${id}`) },
        data: () => ({ id, ...(data || {}) }),
      }))
    : [];

  return { docs, empty: docs.length === 0 };
}

const listeners = new Map<string, Set<() => void>>();

function notifyListeners(path: string) {
  const docSet = listeners.get(path);
  if (docSet) {
    docSet.forEach((cb) => cb());
  }

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

  if (!listeners.has(target.path)) {
    listeners.set(target.path, new Set());
  }
  const listenerCb = () => emitLocal();
  listeners.get(target.path)!.add(listenerCb);

  // Emit immediate cache so UI renders with zero lag
  emitLocal();

  try {
    if (target.kind === 'doc') {
      const unsub = fsOnSnapshot(
        target.fsRef as DocumentReference<DocumentData>,
        (snapshot) => {
          if (isUnsubscribed) return;
          if (snapshot.exists()) {
            const val = snapshot.data();
            setLocalValue(target.path, val);
            callback({
              exists: () => true,
              data: () => val as Record<string, unknown>,
            });
          } else {
            // If server doesn't have it yet, check if local storage has a value
            const localVal = getLocalValue(target.path);
            if (localVal && typeof localVal === 'object' && Object.keys(localVal).length > 0) {
              // Preserve local value and upload to Firestore in the background
              fsSetDoc(target.fsRef as DocumentReference<DocumentData>, localVal as Record<string, unknown>, { merge: true }).catch(() => {});
              callback({
                exists: () => true,
                data: () => localVal as Record<string, unknown>,
              });
            } else {
              callback({
                exists: () => false,
                data: () => (localVal || {}) as Record<string, unknown>,
              });
            }
          }
        },
        (error) => {
          if (isUnsubscribed) return;
          console.warn(`[Firestore listener notice for ${target.path}]:`, error.message);
          emitLocal();
          if (onError) onError(error);
        },
      );

      return () => {
        isUnsubscribed = true;
        unsub();
        listeners.get(target.path)?.delete(listenerCb);
      };
    } else {
      const unsub = fsOnSnapshot(
        target.fsRef as CollectionReference<DocumentData>,
        (snapshot) => {
          if (isUnsubscribed) return;
          const colData: Record<string, Record<string, unknown>> = {};

          snapshot.docs.forEach((docSnap) => {
            const d = docSnap.data();
            const fullDoc = { id: docSnap.id, ...d };
            colData[docSnap.id] = fullDoc;
            setLocalValue(`${target.path}/${docSnap.id}`, fullDoc);
          });

          if (snapshot.docs.length === 0) {
            // Check if local cache has items that should be preserved and synced to Firestore
            const cached = getLocalValue(target.path);
            const cachedEntries = cached && typeof cached === 'object' ? Object.entries(cached) : [];
            if (cachedEntries.length > 0) {
              // Upload any cached documents to Firestore so they are stored safely in cloud database
              cachedEntries.forEach(([id, item]) => {
                if (item && typeof item === 'object') {
                  fsSetDoc(fsDoc(db, `${target.path}/${id}`), item as DocumentData, { merge: true }).catch(() => {});
                }
              });
              callback(toCollectionSnapshot(cached, target.path));
              return;
            }

            setLocalValue(target.path, {});
            callback({ docs: [], empty: true });
            return;
          }

          setLocalValue(target.path, colData);

          const docs: DocumentSnapshot[] = Object.entries(colData).map(([id, d]) => ({
            id,
            ref: { path: `${target.path}/${id}`, kind: 'doc' as const, fsRef: fsDoc(db, `${target.path}/${id}`) },
            data: () => ({ id, ...(d || {}) }),
          }));

          callback({ docs, empty: docs.length === 0 });
        },
        (error) => {
          if (isUnsubscribed) return;
          console.warn(`[Firestore listener notice for ${target.path}]:`, error.message);
          emitLocal();
          if (onError) onError(error);
        },
      );

      return () => {
        isUnsubscribed = true;
        unsub();
        listeners.get(target.path)?.delete(listenerCb);
      };
    }
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
    await fsSetDoc(target.fsRef as DocumentReference<DocumentData>, nextValue, { merge: options?.merge ?? false });
  } catch (err) {
    console.warn('[Firestore setDoc fallback to cache]:', err);
    if (options?.merge) {
      const current = getLocalValue(target.path);
      nextValue = { ...(current || {}), ...(value as Record<string, unknown>) };
    }
  }

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

  // 1. Immediately remove from local cache and notify subscribers
  removeLocalValue(target.path);
  if (collectionPath) {
    const colVal = getLocalValue(collectionPath) || {};
    delete colVal[docId];
    setLocalValue(collectionPath, colVal);
    notifyListeners(collectionPath);
  }
  notifyListeners(target.path);

  // 2. Synchronize deletion with Firestore in background
  try {
    await fsDeleteDoc(target.fsRef as DocumentReference<DocumentData>);
  } catch (err) {
    console.warn('[Firestore deleteDoc fallback to cache]:', err);
  }
}

export async function getDocs(target: PathRef<'collection'>): Promise<CollectionSnapshot> {
  try {
    const snapshot = await fsGetDocs(target.fsRef as CollectionReference<DocumentData>);
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ref: { path: `${target.path}/${docSnap.id}`, kind: 'doc' as const, fsRef: fsDoc(db, `${target.path}/${docSnap.id}`) },
      data: () => docSnap.data(),
    }));
    return { docs, empty: snapshot.empty };
  } catch {
    return toCollectionSnapshot(getLocalValue(target.path), target.path);
  }
}
