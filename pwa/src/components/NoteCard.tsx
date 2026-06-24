import { Link } from 'react-router-dom';
import type { StoredNote } from '../offline/db';
import { parseNoteContent } from '../utils/noteContent';
import { TagBadge } from './TagBadge';
import './NoteCard.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}

function excerpt(content: string, length = 120): string {
  return content.length > length ? `${content.slice(0, length)}…` : content;
}

export function NoteCard({ note }: { note: StoredNote }) {
  const isPending = note.id.startsWith('temp-');
  const { text, photos } = parseNoteContent(note.content);

  return (
    <Link to={`/notes/${note.id}`} className="note-card">
      <div className="note-card__header">
        <h3 className="note-card__title">{note.title || 'Bez tytułu'}</h3>
        {isPending && <span className="note-card__pending">oczekuje na sync</span>}
      </div>
      <p className="note-card__excerpt">
        {photos.length > 0 && '📷 '}
        {excerpt(text) || (photos.length > 0 ? 'Zdjęcie' : 'Brak treści')}
      </p>
      <div className="note-card__footer">
        <div className="note-card__tags">
          {note.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </div>
        <time className="note-card__date" dateTime={note.updated_at}>
          {formatDate(note.updated_at)}
        </time>
      </div>
    </Link>
  );
}
