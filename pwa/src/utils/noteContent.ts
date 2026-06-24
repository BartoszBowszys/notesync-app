// Mirrors mobile/src/utils/noteContent.ts — photos captured on mobile are embedded
// as base64 data URIs on dedicated lines so they survive the shared plain-text API.
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
