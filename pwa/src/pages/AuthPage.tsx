import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    if (mode === 'login') {
      await login(email, password);
    } else {
      await register(email, password);
    }
    navigate('/notes', { replace: true });
  };

  return (
    <div className="auth-page">
      <AuthForm mode={mode} onSubmit={handleSubmit} onModeChange={setMode} />
    </div>
  );
}
