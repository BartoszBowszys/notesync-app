import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontSize, radius, space } from '../theme';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Szukaj notatek…' }: SearchBarProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: space[3],
        },
        input: {
          flex: 1,
          paddingVertical: space[2],
          fontSize: fontSize.base,
          color: colors.text,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={draft}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onChangeText={setDraft}
        accessibilityLabel="Szukaj notatek"
      />
    </View>
  );
}
