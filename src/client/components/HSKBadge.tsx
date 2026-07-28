interface HSKBadgeProps {
  level: number;
  caught?: number;
  total?: number;
  size?: 'sm' | 'md' | 'lg';
}

const HSK_COLORS: Record<number, string> = {
  1: 'bg-[#e8d44d] text-black',
  2: 'bg-[#7bc47f] text-black',
  3: 'bg-[#5dade2] text-black',
  4: 'bg-[#e07b7b] text-black',
  5: 'bg-[#8e44ad] text-white',
  6: 'bg-[#2c3e50] text-white',
};

export default function HSKBadge({ level, caught, total, size = 'sm' }: HSKBadgeProps) {
  const color = HSK_COLORS[level] || 'bg-black text-white';
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-base' : size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
  const progress = caught !== undefined && total !== undefined && total > 0
    ? Math.round((caught / total) * 100)
    : null;

  return (
    <div className={`inline-flex items-center gap-2 border-2 border-black font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${color} ${sizeClasses}`}>
      <span>HSK {level}</span>
      {progress !== null && (
        <span className="text-[10px] opacity-80">
          {caught}/{total} ({progress}%)
        </span>
      )}
    </div>
  );
}
