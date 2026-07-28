interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sublabel?: string;
}

export default function StatCard({ label, value, icon, sublabel }: StatCardProps) {
  return (
    <div className="retro-card p-4 flex flex-col items-center justify-center min-w-[140px]">
      <span className="text-2xl mb-1">{icon}</span>
      <span className="font-mono text-3xl font-bold">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-gray-600 mt-1">
        {label}
      </span>
      {sublabel && (
        <span className="font-mono text-[9px] text-gray-400 mt-0.5">{sublabel}</span>
      )}
    </div>
  );
}
