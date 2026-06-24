import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm';

describe('AuthForm', () => {
  it('shows login copy and submit label in login mode', () => {
    render(<AuthForm mode="login" onSubmit={jest.fn()} onModeChange={jest.fn()} />);

    expect(screen.getByText('Zaloguj się do swojego konta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  it('shows register copy and submit label in register mode', () => {
    render(<AuthForm mode="register" onSubmit={jest.fn()} onModeChange={jest.fn()} />);

    expect(screen.getByText('Stwórz nowe konto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zarejestruj się' })).toBeInTheDocument();
  });

  it('calls onSubmit with the entered email and password', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="login" onSubmit={onSubmit} onModeChange={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'jan@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'supersecret123');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(onSubmit).toHaveBeenCalledWith('jan@example.com', 'supersecret123');
  });

  it('displays an error message when onSubmit rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error('Incorrect email or password'));
    render(<AuthForm mode="login" onSubmit={onSubmit} onModeChange={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'jan@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
  });

  it('calls onModeChange when switching between login and register', async () => {
    const user = userEvent.setup();
    const onModeChange = jest.fn();
    render(<AuthForm mode="login" onSubmit={jest.fn()} onModeChange={onModeChange} />);

    await user.click(screen.getByText('Nie masz konta? Zarejestruj się'));

    expect(onModeChange).toHaveBeenCalledWith('register');
  });
});
