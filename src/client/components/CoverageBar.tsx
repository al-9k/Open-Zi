interface CoverageBarProps {
  percentage: number;
  label?: string;
}

export default function CoverageBar({ percentage, label = 'Coverage' }: CoverageBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="font-mono text-xs font-bold">{clamped.toFixed(1)}%</span>
      </div>
      <div className="w-full h-8 border-2 border-black bg-[#e8dcc8] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div
          className="h-full bg-[#7bc47f] transition-all duration-700 ease-out relative"
          style={{ width: `${clamped}%` }}
        >
          {/* Scan lines on the fill */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.08)_3px,rgba(0,0,0,0.08)_6px)]" />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 border-2 border-black/10 pointer-events-none" />
      </div>
    </div>
  );
}
