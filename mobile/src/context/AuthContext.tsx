import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest, register as registerRequest } from '../api/auth';
import { getToken, setToken } from '../api/client';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken()
      .then(setTokenState)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    await setToken(result.access_token);
    setTokenState(result.access_token);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await registerRequest(email, password);
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    await setToken(null);
    setTokenState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: token !== null, isLoading, login, register, logout }),
    [token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
