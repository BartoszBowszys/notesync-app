export interface Tag {
  id: number;
  name: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface NoteInput {
  title: string;
  content: string;
  tag_ids: number[];
}
