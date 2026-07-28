import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'DASHBOARD', icon: '📟' },
  { path: '/codex', label: 'CODEX', icon: '📚' },
  { path: '/bank', label: 'BANK', icon: '🏦' },
  { path: '/search', label: 'SEARCH', icon: '🔎' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── HEADER ── */}
      <header className="border-b-4 border-black bg-[#1b4332]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 border-2 border-[#7bc47f] bg-[#2d6a4f] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(123,196,127,0.5)] group-hover:shadow-[1px_1px_0px_0px_rgba(123,196,127,0.7)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
              <span className="text-xl">📜</span>
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-wider text-[#d8f3dc]">
                OPEN-ZI
              </h1>
              <p className="font-mono text-[9px] text-[#7bc47f] uppercase tracking-widest">
                Character Codex v1.0
              </p>
            </div>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#95d5b2]">USER:</span>
            <span className="font-mono text-xs font-bold text-[#1b4332] bg-[#7bc47f] border-2 border-[#52b788] px-3 py-1 shadow-[2px_2px_0px_0px_rgba(82,183,136,0.8)]">
              DEFAULT_USER
            </span>
          </div>
        </div>
      </header>

      {/* ── NAVIGATION ── */}
      <nav className="border-b-2 border-black bg-[#2d6a4f] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-5 py-3 font-mono text-xs font-bold border-r-2 border-black/10 transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-[#7bc47f] text-[#1b4332] shadow-[inset_0_-4px_0px_0px_rgba(0,0,0,0.25)]'
                    : 'text-[#b7e4c7] hover:bg-[#40916c] hover:text-[#d8f3dc]'
                  }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t-4 border-black bg-[#1b4332] mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="font-mono text-[9px] text-[#95d5b2] uppercase tracking-widest">
            Open-Zi · Character Codex · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
