import { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createTag } from '../api/tags';
import { TagBadge } from '../components/TagBadge';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { createNoteAware, deleteNoteAware, getNote, listTags, updateNoteAware } from '../offline/notesRepository';
import type { Tag } from '../types';
import { parseNoteContent, serializeNoteContent } from '../utils/noteContent';
import { fontSize, radius, space } from '../theme';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Editor'>;
type Route = RouteProp<RootStackParamList, 'Editor'>;

export function EditorScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const isNew = route.params.id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTags().then(setTags).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isNew) return;
    getNote(route.params.id)
      .then((note) => {
        if (!note) {
          setError('Notatka nie została znaleziona.');
          return;
        }
        const parsed = parseNoteContent(note.content);
        setTitle(note.title);
        setContent(parsed.text);
        setPhotos(parsed.photos);
        setSelectedTagIds(new Set(note.tags.map((tag) => tag.id)));
      })
      .finally(() => setLoading(false));
  }, [isNew, route.params.id]);

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

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Brak uprawnień', 'NoteSync potrzebuje dostępu do kamery, aby dodać zdjęcie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setTakingPhoto(true);
    try {
      const manipulated = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { format: SaveFormat.JPEG, compress: 0.5, base64: true },
      );
      if (manipulated.base64) {
        setPhotos((prev) => [...prev, `data:image/jpeg;base64,${manipulated.base64}`]);
      }
    } catch {
      setError('Nie udało się przetworzyć zdjęcia.');
    } finally {
      setTakingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Tytuł jest wymagany.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = {
        title,
        content: serializeNoteContent(content, photos),
        tag_ids: Array.from(selectedTagIds),
      };
      if (isNew) {
        await createNoteAware(input);
      } else {
        await updateNoteAware(route.params.id, input);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać notatki.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Usunąć notatkę?', undefined, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await deleteNoteAware(route.params.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { padding: space[4], gap: space[4] },
        titleInput: {
          fontSize: fontSize.lg,
          fontWeight: '600',
          padding: space[3],
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.text,
        },
        contentInput: {
          minHeight: 160,
          fontSize: fontSize.base,
          padding: space[3],
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.text,
          textAlignVertical: 'top',
        },
        section: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: space[3],
          gap: space[2],
        },
        sectionTitle: { fontSize: fontSize.sm, color: colors.textMuted },
        tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
        addTagRow: { flexDirection: 'row', gap: space[2] },
        addTagInput: {
          flex: 1,
          padding: space[2],
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
          color: colors.text,
        },
        addTagButton: {
          paddingHorizontal: space[3],
          justifyContent: 'center',
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
        },
        photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
        photoWrapper: { width: 88, height: 88 },
        photo: { width: 88, height: 88, borderRadius: radius.md },
        photoRemove: {
          position: 'absolute',
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        },
        photoRemoveText: { color: '#ffffff', fontSize: fontSize.xs },
        cameraButton: {
          alignSelf: 'flex-start',
          paddingHorizontal: space[3],
          paddingVertical: space[2],
          borderRadius: radius.sm,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.border,
        },
        cameraButtonText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
        error: { color: colors.danger, fontSize: fontSize.sm },
        actions: { flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' },
        button: { paddingHorizontal: space[4], paddingVertical: space[3], borderRadius: radius.md },
        cancelButton: { backgroundColor: colors.surfaceAlt },
        deleteButton: { backgroundColor: colors.danger },
        saveButton: { backgroundColor: colors.accent },
        cancelText: { color: colors.text, fontWeight: '600' },
        deleteText: { color: '#ffffff', fontWeight: '600' },
        saveText: { color: colors.accentContrast, fontWeight: '600' },
      }),
    [colors],
  );

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        style={styles.titleInput}
        placeholder="Tytuł notatki"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.contentInput}
        placeholder="Treść notatki…"
        placeholderTextColor={colors.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zdjęcia</Text>
        {photos.length > 0 && (
          <View style={styles.photosRow}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Text style={styles.photoRemoveText}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Pressable style={styles.cameraButton} onPress={handleTakePhoto} disabled={takingPhoto}>
          {takingPhoto ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <Text style={styles.cameraButtonText}>📷 Zrób zdjęcie</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tagi</Text>
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              active={selectedTagIds.has(tag.id)}
              onPress={() => toggleTag(tag.id)}
            />
          ))}
        </View>
        <View style={styles.addTagRow}>
          <TextInput
            style={styles.addTagInput}
            placeholder="Nowy tag…"
            placeholderTextColor={colors.textMuted}
            value={newTagName}
            onChangeText={setNewTagName}
            onSubmitEditing={handleAddTag}
          />
          <Pressable style={styles.addTagButton} onPress={handleAddTag}>
            <Text style={styles.cancelText}>Dodaj</Text>
          </Pressable>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Anuluj</Text>
        </Pressable>
        {!isNew && (
          <Pressable style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.deleteText}>Usuń</Text>
          </Pressable>
        )}
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.accentContrast} /> : <Text style={styles.saveText}>Zapisz</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}
