import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NoteCard } from './NoteCard';
import type { StoredNote } from '../offline/db';

function makeNote(overrides: Partial<StoredNote> = {}): StoredNote {
  return {
    id: '1',
    title: 'Spotkanie zespołu',
    content: 'Omówienie planu na Q3',
    tags: [{ id: 1, name: 'praca' }],
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-02T10:00:00Z',
    ...overrides,
  };
}

function renderNoteCard(note: StoredNote) {
  return render(
    <MemoryRouter>
      <NoteCard note={note} />
    </MemoryRouter>,
  );
}

describe('NoteCard', () => {
  it('renders the title, excerpt and tags', () => {
    renderNoteCard(makeNote());

    expect(screen.getByText('Spotkanie zespołu')).toBeInTheDocument();
    expect(screen.getByText('Omówienie planu na Q3')).toBeInTheDocument();
    expect(screen.getByText('#praca')).toBeInTheDocument();
  });

  it('falls back to a placeholder title when empty', () => {
    renderNoteCard(makeNote({ title: '' }));

    expect(screen.getByText('Bez tytułu')).toBeInTheDocument();
  });

  it('shows a pending-sync badge for notes with a temp id', () => {
    renderNoteCard(makeNote({ id: 'temp-abc123' }));

    expect(screen.getByText('oczekuje na sync')).toBeInTheDocument();
  });

  it('does not show a pending-sync badge for synced notes', () => {
    renderNoteCard(makeNote({ id: '42' }));

    expect(screen.queryByText('oczekuje na sync')).not.toBeInTheDocument();
  });

  it('indicates an attached photo and hides the raw base64 data', () => {
    renderNoteCard(
      makeNote({ content: 'Wycieczka\n[notesync-photo]:data:image/jpeg;base64,AAAA' }),
    );

    expect(screen.getByText(/📷/)).toBeInTheDocument();
    expect(screen.getByText(/Wycieczka/)).toBeInTheDocument();
    expect(screen.queryByText(/base64/)).not.toBeInTheDocument();
  });

  it('links to the note editor route', () => {
    renderNoteCard(makeNote({ id: '7' }));

    expect(screen.getByRole('link')).toHaveAttribute('href', '/notes/7');
  });
});
