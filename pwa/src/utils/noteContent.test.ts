import { parseNoteContent, serializeNoteContent } from './noteContent';

describe('parseNoteContent', () => {
  it('returns plain text untouched when there are no photos', () => {
    const result = parseNoteContent('Just some plain note text');

    expect(result.text).toBe('Just some plain note text');
    expect(result.photos).toEqual([]);
  });

  it('extracts photo marker lines from the content', () => {
    const content = 'Notatka z wycieczki\n[notesync-photo]:data:image/jpeg;base64,AAAA';

    const result = parseNoteContent(content);

    expect(result.text).toBe('Notatka z wycieczki');
    expect(result.photos).toEqual(['data:image/jpeg;base64,AAAA']);
  });

  it('extracts multiple photo lines and preserves order', () => {
    const content = [
      'Tytuł',
      '[notesync-photo]:data:image/jpeg;base64,FIRST',
      '[notesync-photo]:data:image/jpeg;base64,SECOND',
    ].join('\n');

    const result = parseNoteContent(content);

    expect(result.photos).toEqual(['data:image/jpeg;base64,FIRST', 'data:image/jpeg;base64,SECOND']);
  });

  it('returns an empty text when the note only contains photos', () => {
    const result = parseNoteContent('[notesync-photo]:data:image/jpeg;base64,AAAA');

    expect(result.text).toBe('');
    expect(result.photos).toEqual(['data:image/jpeg;base64,AAAA']);
  });
});

describe('serializeNoteContent', () => {
  it('joins text and photos back into a single content string', () => {
    const result = serializeNoteContent('Hello', ['data:image/jpeg;base64,AAAA']);

    expect(result).toBe('Hello\n[notesync-photo]:data:image/jpeg;base64,AAAA');
  });

  it('omits the photo section when there are no photos', () => {
    const result = serializeNoteContent('Hello', []);

    expect(result).toBe('Hello');
  });

  it('round-trips through parseNoteContent', () => {
    const original = serializeNoteContent('Wpis z notatkami', [
      'data:image/jpeg;base64,AAAA',
      'data:image/jpeg;base64,BBBB',
    ]);

    const parsed = parseNoteContent(original);

    expect(parsed.text).toBe('Wpis z notatkami');
    expect(parsed.photos).toEqual(['data:image/jpeg;base64,AAAA', 'data:image/jpeg;base64,BBBB']);
  });
});
