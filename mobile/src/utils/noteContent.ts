// Photos taken with the camera are embedded as base64 data URIs on dedicated
// lines so they survive round-trips through the backend's plain-text `content`
// field without requiring a schema change. Each marker line is fully self-contained.
const PHOTO_PREFIX = '[notesync-photo]:';

export interface ParsedNoteContent {
  text: string;
  photos: string[];
}

export function parseNoteContent(content: string): ParsedNoteContent {
  const lines = content.split('\n');
  const textLines: string[] = [];
  const photos: string[] = [];

  for (const line of lines) {
    if (line.startsWith(PHOTO_PREFIX)) {
      photos.push(line.slice(PHOTO_PREFIX.length));
    } else {
      textLines.push(line);
    }
  }

  return { text: textLines.join('\n').trim(), photos };
}

export function serializeNoteContent(text: string, photos: string[]): string {
  const photoLines = photos.map((photo) => `${PHOTO_PREFIX}${photo}`);
  return [text.trim(), ...photoLines].filter(Boolean).join('\n');
}
