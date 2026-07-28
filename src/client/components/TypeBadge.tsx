interface TypeBadgeProps {
  type: 'c' | 'w';
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const label = type === 'c' ? 'CHAR' : 'WORD';
  const bg = type === 'c' ? 'bg-[#e8d44d]' : 'bg-[#7bc47f]';

  return (
    <span className={`retro-badge ${bg} text-[10px]`}>
      {label}
    </span>
  );
}
