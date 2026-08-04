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

function toCollectionSnapshot(snapshot: DataSnapshot, path: string): CollectionSnapshot {
  const value = snapshot.val() as Record<string, Record<string, unknown>> | null;
  const docs = value
    ? Object.entries(value).map(([id, data]) => ({
        id,
        ref: { path: `${path}/${id}`, kind: 'doc' as const },
        data: () => data || {},
      }))
    : [];

  return { docs, empty: docs.length === 0 };
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
  return rtdbOnValue(
    rtdbRef(db, target.path),
    (snapshot) => {
      if (target.kind === 'doc') {
        callback({
          exists: () => snapshot.exists(),
          data: () => (snapshot.val() || {}) as Record<string, unknown>,
        });
      } else {
        callback(toCollectionSnapshot(snapshot, target.path));
      }
    },
    onError,
  );
}

export async function setDoc(target: PathRef<'doc'>, value: unknown, options?: { merge?: boolean }) {
  let nextValue = value as Record<string, unknown>;
  if (options?.merge) {
    const current = (await rtdbGet(rtdbRef(db, target.path))).val();
    nextValue = { ...(current || {}), ...(value as Record<string, unknown>) };
  }
  await rtdbSet(rtdbRef(db, target.path), nextValue);
}

export async function deleteDoc(target: PathRef<'doc'>) {
  await rtdbRemove(rtdbRef(db, target.path));
}

export async function getDocs(target: PathRef<'collection'>): Promise<CollectionSnapshot> {
  return toCollectionSnapshot(await rtdbGet(rtdbRef(db, target.path)), target.path);
}