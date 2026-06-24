import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontSize, radius, space } from '../theme';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  onModeChange: (mode: 'login' | 'register') => void;
}

export function AuthForm({ mode, onSubmit, onModeChange }: AuthFormProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coś poszło nie tak');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '100%',
          maxWidth: 360,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: space[6],
          gap: space[3],
        },
        title: {
          fontSize: fontSize.xl,
          fontWeight: '700',
          color: colors.accent,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: fontSize.sm,
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: space[2],
        },
        label: {
          fontSize: fontSize.sm,
          color: colors.textMuted,
          marginBottom: space[1],
        },
        input: {
          padding: space[3],
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
          color: colors.text,
          fontSize: fontSize.base,
        },
        error: {
          color: colors.danger,
          fontSize: fontSize.sm,
        },
        submit: {
          marginTop: space[2],
          padding: space[3],
          borderRadius: radius.sm,
          backgroundColor: colors.accent,
          alignItems: 'center',
        },
        submitText: {
          color: colors.accentContrast,
          fontWeight: '600',
          fontSize: fontSize.base,
        },
        switchButton: {
          padding: space[1],
          alignItems: 'center',
        },
        switchText: {
          color: colors.accent,
          fontSize: fontSize.sm,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>NoteSync</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Zaloguj się do swojego konta' : 'Stwórz nowe konto'}
      </Text>

      <View>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View>
        <Text style={styles.label}>Hasło</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.submit} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.accentContrast} />
        ) : (
          <Text style={styles.submitText}>{mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}</Text>
        )}
      </Pressable>

      <Pressable style={styles.switchButton} onPress={() => onModeChange(mode === 'login' ? 'register' : 'login')}>
        <Text style={styles.switchText}>
          {mode === 'login' ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </Text>
      </Pressable>
    </View>
  );
}
