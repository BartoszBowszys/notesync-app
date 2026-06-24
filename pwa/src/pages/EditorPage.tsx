import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TagBadge } from '../components/TagBadge';
import { createTag } from '../api/tags';
import { createNoteAware, deleteNoteAware, getNote, listTags, updateNoteAware } from '../offline/notesRepository';
import type { Tag } from '../types';
import './EditorPage.css';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTags().then(setTags).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    getNote(id)
      .then((note) => {
        if (!note) {
          setError('Notatka nie została znaleziona.');
          return;
        }
        setTitle(note.title);
        setContent(note.content);
        setSelectedTagIds(new Set(note.tags.map((tag) => tag.id)));
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const tag = await createTag(name);
      setTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => new Set(prev).add(tag.id));
      setNewTagName('');
    } catch {
      setError('Nie można dodać tagu offline. Połącz się z internetem.');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = { title, content, tag_ids: Array.from(selectedTagIds) };
      if (isNew) {
        await createNoteAware(input);
      } else if (id) {
        await updateNoteAware(id, input);
      }
      navigate('/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać notatki.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!window.confirm('Usunąć tę notatkę?')) return;
    await deleteNoteAware(id);
    navigate('/notes');
  };

  if (loading) {
    return <p className="editor-page__empty">Wczytywanie…</p>;
  }

  return (
    <form className="editor-page" onSubmit={handleSubmit}>
      <input
        className="editor-page__title"
        placeholder="Tytuł notatki"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />

      <textarea
        className="editor-page__content"
        placeholder="Treść notatki…"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={12}
      />

      <div className="editor-page__tags-section">
        <h2 className="editor-page__tags-title">Tagi</h2>
        <div className="editor-page__tags">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              active={selectedTagIds.has(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>
        <div className="editor-page__add-tag">
          <input
            value={newTagName}
            placeholder="Nowy tag…"
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAddTag();
              }
            }}
          />
          <button type="button" onClick={handleAddTag}>
            Dodaj
          </button>
        </div>
      </div>

      {error && <p className="editor-page__error" role="alert">{error}</p>}

      <div className="editor-page__actions">
        <button type="button" className="editor-page__cancel" onClick={() => navigate('/notes')}>
          Anuluj
        </button>
        {!isNew && (
          <button type="button" className="editor-page__delete" onClick={handleDelete}>
            Usuń
          </button>
        )}
        <button type="submit" className="editor-page__save" disabled={saving}>
          {saving ? 'Zapisywanie…' : 'Zapisz'}
        </button>
      </div>
    </form>
  );
}
