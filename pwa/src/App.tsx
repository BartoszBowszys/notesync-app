import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { registerAutoSync } from './offline/sync';
import { AuthPage } from './pages/AuthPage';
import { EditorPage } from './pages/EditorPage';
import { NotesPage } from './pages/NotesPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    return registerAutoSync();
  }, [isAuthenticated]);

  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/notes" replace /> : <AuthPage />} />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes/:id"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/notes" replace />} />
          <Route path="*" element={<Navigate to="/notes" replace />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
