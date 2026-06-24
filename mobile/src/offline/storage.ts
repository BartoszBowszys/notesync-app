import AsyncStorage from '@react-native-async-storage/async-storage';
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

const NOTES_KEY = 'notesync.notes';
const TAGS_KEY = 'notesync.tags';
const OUTBOX_KEY = 'notesync.outbox';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value));
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
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith('temp-');
}

export async function getCachedNotes(): Promise<StoredNote[]> {
  return readJson<StoredNote[]>(NOTES_KEY, []);
}

export async function getCachedNote(id: string): Promise<StoredNote | undefined> {
  const notes = await getCachedNotes();
  return notes.find((n) => n.id === id);
}

export async function saveLocalNote(note: StoredNote): Promise<void> {
  const notes = await getCachedNotes();
  const next = notes.filter((n) => n.id !== note.id);
  next.push(note);
  await writeJson(NOTES_KEY, next);
}

export async function deleteLocalNote(id: string): Promise<void> {
  const notes = await getCachedNotes();
  await writeJson(NOTES_KEY, notes.filter((n) => n.id !== id));
}

export async function replaceSyncedNotes(notes: Note[]): Promise<void> {
  const existing = await getCachedNotes();
  const pendingTemp = existing.filter((n) => isTempId(n.id));
  await writeJson(NOTES_KEY, [...pendingTemp, ...notes.map(toStoredNote)]);
}

export function getCachedTags(): Promise<Tag[]> {
  return readJson<Tag[]>(TAGS_KEY, []);
}

export function replaceCachedTags(tags: Tag[]): Promise<void> {
  return writeJson(TAGS_KEY, tags);
}

export function getOutbox(): Promise<OutboxEntry[]> {
  return readJson<OutboxEntry[]>(OUTBOX_KEY, []);
}

export async function putOutboxEntry(entry: OutboxEntry): Promise<void> {
  const outbox = await getOutbox();
  const next = outbox.filter((e) => e.noteId !== entry.noteId);
  next.push(entry);
  await writeJson(OUTBOX_KEY, next);
}

export async function removeOutboxEntry(noteId: string): Promise<void> {
  const outbox = await getOutbox();
  await writeJson(OUTBOX_KEY, outbox.filter((e) => e.noteId !== noteId));
}
