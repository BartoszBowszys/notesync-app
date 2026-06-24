import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteCard } from '../components/NoteCard';
import { SearchBar } from '../components/SearchBar';
import { TagBadge } from '../components/TagBadge';
import { useTheme } from '../context/ThemeContext';
import type { StoredNote } from '../offline/storage';
import { listNotes, listTags } from '../offline/notesRepository';
import type { RootStackParamList } from '../navigation/types';
import type { Tag } from '../types';
import { fontSize, space } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Notes'>;

export function NotesScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    listNotes({ search: search || undefined, tag: activeTag ?? undefined })
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [search, activeTag]);

  useFocusEffect(
    useCallback(() => {
      listTags().then(setTags).catch(() => undefined);
      reload();
    }, [reload]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        toolbar: { padding: space[4], gap: space[3] },
        tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], paddingHorizontal: space[4] },
        list: { padding: space[4], gap: space[3] },
        empty: { textAlign: 'center', color: colors.textMuted, marginTop: space[6] },
        fab: {
          position: 'absolute',
          right: space[4],
          bottom: space[5],
          backgroundColor: colors.accent,
          borderRadius: 999,
          width: 56,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 4,
        },
        fabText: { color: colors.accentContrast, fontSize: fontSize.xl, lineHeight: fontSize.xl },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} />
      </View>

      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          <TagBadge name="wszystkie" active={activeTag === null} onPress={() => setActiveTag(null)} />
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              active={activeTag === tag.name}
              onPress={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
            />
          ))}
        </View>
      )}

      <FlatList
        contentContainerStyle={styles.list}
        data={notes}
        keyExtractor={(item) => item.id}
        onRefresh={reload}
        refreshing={loading}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Brak notatek. Stwórz pierwszą!</Text> : null
        }
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => navigation.navigate('Editor', { id: item.id })} />
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('Editor', { id: 'new' })}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}
