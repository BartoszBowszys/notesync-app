import { ApiError } from '../api/client';
import { createNote, deleteNote, fetchNotes, updateNote } from '../api/notes';
import { fetchTags } from '../api/tags';
import {
  deleteLocalNote,
  getOutbox,
  removeOutboxEntry,
  replaceCachedTags,
  replaceSyncedNotes,
  saveLocalNote,
  toStoredNote,
} from './db';

export type SyncListener = (status: 'syncing' | 'done' | 'offline') => void;

const listeners = new Set<SyncListener>();
let syncing = false;

export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(status: 'syncing' | 'done' | 'offline') {
  listeners.forEach((listener) => listener(status));
}

export function isOnline(): boolean {
  return navigator.onLine;
}

async function drainOutbox(): Promise<void> {
  const outbox = await getOutbox();

  for (const entry of outbox) {
    try {
      if (entry.kind === 'create' && entry.input) {
        const created = await createNote(entry.input);
        await deleteLocalNote(entry.noteId);
        await saveLocalNote(toStoredNote(created));
      } else if (entry.kind === 'update' && entry.input) {
        const updated = await updateNote(Number(entry.noteId), entry.input);
        await saveLocalNote(toStoredNote(updated));
      } else if (entry.kind === 'delete') {
        await deleteNote(Number(entry.noteId));
        await deleteLocalNote(entry.noteId);
      }
      await removeOutboxEntry(entry.noteId);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        // Network unreachable again — stop draining, retry on next sync.
        throw error;
      }
      if (error.status === 404) {
        // Already gone server-side (deleted/conflict) — drop the stale entry.
        await deleteLocalNote(entry.noteId);
        await removeOutboxEntry(entry.noteId);
        continue;
      }
      // Other client errors (validation, auth) cannot be auto-retried.
      await removeOutboxEntry(entry.noteId);
    }
  }
}

export async function syncNow(): Promise<void> {
  if (syncing || !isOnline()) {
    return;
  }
  syncing = true;
  notify('syncing');
  try {
    await drainOutbox();
    const [notes, tags] = await Promise.all([fetchNotes(), fetchTags()]);
    await replaceSyncedNotes(notes);
    await replaceCachedTags(tags);
    notify('done');
  } catch {
    notify('offline');
  } finally {
    syncing = false;
  }
}

export function registerAutoSync(): () => void {
  const handleOnline = () => {
    void syncNow();
  };
  window.addEventListener('online', handleOnline);
  if (isOnline()) {
    void syncNow();
  }
  return () => window.removeEventListener('online', handleOnline);
}
