import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { space } from '../theme';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register } = useAuth();
  const { colors } = useTheme();

  const handleSubmit = async (email: string, password: string) => {
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(email, password);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space[4],
        },
      }),
    [colors],
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View>
        <AuthForm mode={mode} onSubmit={handleSubmit} onModeChange={setMode} />
      </View>
    </KeyboardAvoidingView>
  );
}
