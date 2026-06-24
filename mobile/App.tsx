import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { registerAutoSync } from './src/offline/sync';

function AutoSync() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    return registerAutoSync();
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AutoSync />
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
