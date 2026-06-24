import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders the current value', () => {
    render(<SearchBar value="budget" onChange={() => {}} />);

    expect(screen.getByRole('searchbox', { name: 'Szukaj notatek' })).toHaveValue('budget');
  });

  it('debounces onChange so it fires once after typing stops', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} />);

    await user.type(screen.getByRole('searchbox'), 'note');
    expect(onChange).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('note');
    jest.useRealTimers();
  });
});
