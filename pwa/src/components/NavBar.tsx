import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { onSyncStatusChange } from '../offline/sync';
import './NavBar.css';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('notesync.theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'done' | 'offline'>('done');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('notesync.theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = onSyncStatusChange(setSyncStatus);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const statusLabel = !online
    ? 'Offline — zmiany zapisane lokalnie'
    : syncStatus === 'syncing'
      ? 'Synchronizacja…'
      : 'Online';

  return (
    <header className="nav-bar">
      <Link to="/" className="nav-bar__brand">
        NoteSync
      </Link>

      <span className={`nav-bar__status nav-bar__status--${online ? syncStatus : 'offline'}`}>
        {statusLabel}
      </span>

      <div className="nav-bar__actions">
        <button
          type="button"
          className="nav-bar__icon-button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label="Przełącz motyw"
          title="Przełącz motyw"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {isAuthenticated && (
          <button
            type="button"
            className="nav-bar__icon-button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            aria-label="Wyloguj"
            title="Wyloguj"
          >
            🚪
          </button>
        )}
      </div>
    </header>
  );
}
