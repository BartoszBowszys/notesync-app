import { apiRequest } from './client';
import type { Tag } from '../types';

export function fetchTags(): Promise<Tag[]> {
  return apiRequest<Tag[]>('/tags');
}

export function createTag(name: string): Promise<Tag> {
  return apiRequest<Tag>('/tags', { method: 'POST', body: { name } });
}
