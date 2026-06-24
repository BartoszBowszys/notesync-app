import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoteCard } from '../components/NoteCard';
import { SearchBar } from '../components/SearchBar';
import { TagBadge } from '../components/TagBadge';
import type { StoredNote } from '../offline/db';
import { listNotes, listTags } from '../offline/notesRepository';
import type { Tag } from '../types';
import './NotesPage.css';

export function NotesPage() {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTags().then(setTags).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    listNotes({ search: search || undefined, tag: activeTag ?? undefined })
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [search, activeTag]);

  return (
    <div className="notes-page">
      <div className="notes-page__toolbar">
        <SearchBar value={search} onChange={setSearch} />
        <Link to="/notes/new" className="notes-page__new-button">
          + Nowa notatka
        </Link>
      </div>

      {tags.length > 0 && (
        <div className="notes-page__tags">
          <TagBadge name="wszystkie" active={activeTag === null} onClick={() => setActiveTag(null)} />
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              active={activeTag === tag.name}
              onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
            />
          ))}
        </div>
      )}

      {loading ? (
        <p className="notes-page__empty">Wczytywanie…</p>
      ) : notes.length === 0 ? (
        <p className="notes-page__empty">Brak notatek. Stwórz pierwszą!</p>
      ) : (
        <div className="notes-page__list">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
