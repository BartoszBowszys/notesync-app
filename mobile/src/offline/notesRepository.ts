import { ApiError } from '../api/client';
import { createNote, deleteNote, fetchNote, fetchNotes, type NotesFilter, updateNote } from '../api/notes';
import { fetchTags } from '../api/tags';
import type { NoteInput, Tag } from '../types';
import {
  deleteLocalNote,
  getCachedNote,
  getCachedNotes,
  getCachedTags,
  isTempId,
  makeTempId,
  putOutboxEntry,
  replaceCachedTags,
  replaceSyncedNotes,
  saveLocalNote,
  toStoredNote,
  type StoredNote,
} from './storage';

function matchesFilter(note: StoredNote, filter: NotesFilter): boolean {
  if (filter.tag && !note.tags.some((tag) => tag.name === filter.tag)) {
    return false;
  }
  if (filter.search) {
    const needle = filter.search.toLowerCase();
    const haystack = `${note.title} ${note.content}`.toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }
  return true;
}

function sortByUpdatedDesc(notes: StoredNote[]): StoredNote[] {
  return [...notes].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export async function listNotes(filter: NotesFilter = {}): Promise<StoredNote[]> {
  try {
    const notes = await fetchNotes(filter);
    await replaceSyncedNotes(notes);
    return sortByUpdatedDesc((await getCachedNotes()).filter((n) => matchesFilter(n, filter)));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const cached = await getCachedNotes();
    return sortByUpdatedDesc(cached.filter((n) => matchesFilter(n, filter)));
  }
}

export async function getNote(id: string): Promise<StoredNote | undefined> {
  if (!isTempId(id)) {
    try {
      const note = await fetchNote(Number(id));
      const stored = toStoredNote(note);
      await saveLocalNote(stored);
      return stored;
    } catch (error) {
      if (error instanceof ApiError) throw error;
    }
  }
  return getCachedNote(id);
}

export async function listTags(): Promise<Tag[]> {
  try {
    const tags = await fetchTags();
    await replaceCachedTags(tags);
    return tags;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return getCachedTags();
  }
}

export async function createNoteAware(input: NoteInput): Promise<StoredNote> {
  try {
    const created = await createNote(input);
    const stored = toStoredNote(created);
    await saveLocalNote(stored);
    return stored;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const tempId = makeTempId();
    const now = new Date().toISOString();
    const cachedTags = await getCachedTags();
    const stored: StoredNote = {
      id: tempId,
      title: input.title,
      content: input.content,
      tags: cachedTags.filter((tag) => input.tag_ids.includes(tag.id)),
      created_at: now,
      updated_at: now,
    };
    await saveLocalNote(stored);
    await putOutboxEntry({ noteId: tempId, kind: 'create', input });
    return stored;
  }
}

export async function updateNoteAware(id: string, input: NoteInput): Promise<StoredNote> {
  if (!isTempId(id)) {
    try {
      const updated = await updateNote(Number(id), input);
      const stored = toStoredNote(updated);
      await saveLocalNote(stored);
      return stored;
    } catch (error) {
      if (error instanceof ApiError) throw error;
    }
  }

  const existing = await getCachedNote(id);
  const cachedTags = await getCachedTags();
  const stored: StoredNote = {
    id,
    title: input.title,
    content: input.content,
    tags: cachedTags.filter((tag) => input.tag_ids.includes(tag.id)),
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await saveLocalNote(stored);
  await putOutboxEntry({ noteId: id, kind: isTempId(id) ? 'create' : 'update', input });
  return stored;
}

export async function deleteNoteAware(id: string): Promise<void> {
  if (!isTempId(id)) {
    try {
      await deleteNote(Number(id));
      await deleteLocalNote(id);
      return;
    } catch (error) {
      if (error instanceof ApiError) throw error;
    }
  }

  await deleteLocalNote(id);
  if (isTempId(id)) {
    return;
  }
  await putOutboxEntry({ noteId: id, kind: 'delete' });
}

export { syncNow } from './sync';
