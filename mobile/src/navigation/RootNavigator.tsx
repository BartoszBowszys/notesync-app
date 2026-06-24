import { useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthScreen } from '../screens/AuthScreen';
import { EditorScreen } from '../screens/EditorScreen';
import { NotesScreen } from '../screens/NotesScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderActions() {
  const { mode, toggle } = useTheme();
  const { logout } = useAuth();

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Pressable onPress={toggle} accessibilityLabel="Przełącz motyw">
        <Text style={{ fontSize: 18 }}>{mode === 'light' ? '🌙' : '☀️'}</Text>
      </Pressable>
      <Pressable onPress={() => logout()} accessibilityLabel="Wyloguj">
        <Text style={{ fontSize: 18 }}>🚪</Text>
      </Pressable>
    </View>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, mode } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, mode]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="Notes"
              component={NotesScreen}
              options={{ title: 'NoteSync', headerRight: () => <HeaderActions /> }}
            />
            <Stack.Screen name="Editor" component={EditorScreen} options={{ title: 'Notatka' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
