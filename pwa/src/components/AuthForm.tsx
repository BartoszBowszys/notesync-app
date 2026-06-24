import { useState, type FormEvent } from 'react';
import './AuthForm.css';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  onModeChange: (mode: 'login' | 'register') => void;
}

export function AuthForm({ mode, onSubmit, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1 className="auth-form__title">NoteSync</h1>
      <p className="auth-form__subtitle">
        {mode === 'login' ? 'Zaloguj się do swojego konta' : 'Stwórz nowe konto'}
      </p>

      <label className="auth-form__field">
        <span>Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="auth-form__field">
        <span>Hasło</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error && <p className="auth-form__error" role="alert">{error}</p>}

      <button type="submit" className="auth-form__submit" disabled={submitting}>
        {submitting ? 'Czekaj…' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
      </button>

      <button
        type="button"
        className="auth-form__switch"
        onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
      </button>
    </form>
  );
}
