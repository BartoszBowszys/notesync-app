import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontSize, radius, space } from '../theme';

interface TagBadgeProps {
  name: string;
  active?: boolean;
  onPress?: () => void;
}

export function TagBadge({ name, active = false, onPress }: TagBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          paddingHorizontal: space[3],
          paddingVertical: space[1],
          borderRadius: 999,
          backgroundColor: active ? colors.accent : colors.surfaceAlt,
          borderWidth: 1,
          borderColor: active ? colors.accent : colors.border,
        },
        text: {
          fontSize: fontSize.xs,
          fontWeight: '500',
          color: active ? colors.accentContrast : colors.textMuted,
        },
      }),
    [colors, active],
  );

  if (!onPress) {
    return (
      <Pressable disabled style={styles.badge}>
        <Text style={styles.text}>#{name}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.badge} onPress={onPress}>
      <Text style={styles.text}>#{name}</Text>
    </Pressable>
  );
}
