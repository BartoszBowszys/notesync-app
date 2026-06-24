import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagBadge } from './TagBadge';

describe('TagBadge', () => {
  it('renders the tag name prefixed with #', () => {
    render(<TagBadge name="praca" />);

    expect(screen.getByText('#praca')).toBeInTheDocument();
  });

  it('renders as a static, non-interactive element when no onClick is given', () => {
    render(<TagBadge name="praca" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders as a button and reports active state via aria-pressed', () => {
    render(<TagBadge name="praca" active onClick={() => {}} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<TagBadge name="praca" onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
