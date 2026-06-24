import { apiRequest } from './client';
import type { Note, NoteInput } from '../types';

export interface NotesFilter {
  tag?: string;
  search?: string;
}

export function fetchNotes(filter: NotesFilter = {}): Promise<Note[]> {
  const params = new URLSearchParams();
  if (filter.tag) params.set('tag', filter.tag);
  if (filter.search) params.set('search', filter.search);
  const query = params.toString();
  return apiRequest<Note[]>(`/notes${query ? `?${query}` : ''}`);
}

export function fetchNote(id: number): Promise<Note> {
  return apiRequest<Note>(`/notes/${id}`);
}

export function createNote(input: NoteInput): Promise<Note> {
  return apiRequest<Note>('/notes', { method: 'POST', body: input });
}

export function updateNote(id: number, input: NoteInput): Promise<Note> {
  return apiRequest<Note>(`/notes/${id}`, { method: 'PUT', body: input });
}

export function deleteNote(id: number): Promise<void> {
  return apiRequest<void>(`/notes/${id}`, { method: 'DELETE' });
}
