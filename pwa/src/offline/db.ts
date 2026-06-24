import { openDB, type IDBPDatabase } from 'idb';
import type { Note, NoteInput, Tag } from '../types';

export interface StoredNote {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export type OutboxKind = 'create' | 'update' | 'delete';

export interface OutboxEntry {
  noteId: string;
  kind: OutboxKind;
  input?: NoteInput;
}

const DB_NAME = 'notesync-cache';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'noteId' });
        }
      },
    });
  }
  return dbPromise;
}

export function toStoredNote(note: Note): StoredNote {
  return {
    id: String(note.id),
    title: note.title,
    content: note.content,
    tags: note.tags,
    created_at: note.created_at,
    updated_at: note.updated_at,
  };
}

export function makeTempId(): string {
  return `temp-${crypto.randomUUID()}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith('temp-');
}

export async function getCachedNotes(): Promise<StoredNote[]> {
  const db = await getDb();
  return db.getAll('notes');
}

export async function getCachedNote(id: string): Promise<StoredNote | undefined> {
  const db = await getDb();
  return db.get('notes', id);
}

export async function saveLocalNote(note: StoredNote): Promise<void> {
  const db = await getDb();
  await db.put('notes', note);
}

export async function deleteLocalNote(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('notes', id);
}

export async function replaceSyncedNotes(notes: Note[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  const existing: StoredNote[] = await store.getAll();
  await Promise.all(
    existing.filter((n) => !isTempId(n.id)).map((n) => store.delete(n.id)),
  );
  await Promise.all(notes.map((note) => store.put(toStoredNote(note))));
  await tx.done;
}

export async function getCachedTags(): Promise<Tag[]> {
  const db = await getDb();
  return db.getAll('tags');
}

export async function replaceCachedTags(tags: Tag[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('tags', 'readwrite');
  await tx.objectStore('tags').clear();
  await Promise.all(tags.map((tag) => tx.objectStore('tags').put(tag)));
  await tx.done;
}

export async function getOutbox(): Promise<OutboxEntry[]> {
  const db = await getDb();
  return db.getAll('outbox');
}

export async function putOutboxEntry(entry: OutboxEntry): Promise<void> {
  const db = await getDb();
  await db.put('outbox', entry);
}

export async function removeOutboxEntry(noteId: string): Promise<void> {
  const db = await getDb();
  await db.delete('outbox', noteId);
}
