import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { StoredNote } from '../offline/storage';
import { parseNoteContent } from '../utils/noteContent';
import { fontSize, radius, space } from '../theme';
import { TagBadge } from './TagBadge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}

function excerpt(content: string, length = 120): string {
  return content.length > length ? `${content.slice(0, length)}…` : content;
}

interface NoteCardProps {
  note: StoredNote;
  onPress: () => void;
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const { colors } = useTheme();
  const { text, photos } = parseNoteContent(note.content);
  const isPending = note.id.startsWith('temp-');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: space[4],
          gap: space[2],
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: space[2],
        },
        title: {
          flex: 1,
          fontSize: fontSize.lg,
          fontWeight: '600',
          color: colors.text,
        },
        pending: {
          fontSize: fontSize.xs,
          color: colors.textMuted,
          backgroundColor: colors.surfaceAlt,
          paddingHorizontal: space[2],
          paddingVertical: 2,
          borderRadius: 999,
        },
        excerpt: {
          fontSize: fontSize.sm,
          color: colors.textMuted,
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: space[2],
        },
        tags: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: space[2],
          flex: 1,
        },
        date: {
          fontSize: fontSize.xs,
          color: colors.textMuted,
        },
      }),
    [colors],
  );

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title || 'Bez tytułu'}
        </Text>
        {isPending && <Text style={styles.pending}>oczekuje na sync</Text>}
      </View>
      <Text style={styles.excerpt} numberOfLines={2}>
        {photos.length > 0 ? '📷 ' : ''}
        {excerpt(text) || (photos.length > 0 ? 'Zdjęcie' : 'Brak treści')}
      </Text>
      <View style={styles.footer}>
        <View style={styles.tags}>
          {note.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </View>
        <Text style={styles.date}>{formatDate(note.updated_at)}</Text>
      </View>
    </Pressable>
  );
}
