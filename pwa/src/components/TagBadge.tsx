import './TagBadge.css';

interface TagBadgeProps {
  name: string;
  active?: boolean;
  onClick?: () => void;
}

export function TagBadge({ name, active = false, onClick }: TagBadgeProps) {
  const className = `tag-badge${active ? ' tag-badge--active' : ''}${onClick ? ' tag-badge--clickable' : ''}`;

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        #{name}
      </button>
    );
  }

  return <span className={className}>#{name}</span>;
}
