import { useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { addCharacters } from '../lib/api';

interface QuickAddBarProps {
  onCharactersAdded?: () => void;
}

export default function QuickAddBar({ onCharactersAdded }: QuickAddBarProps) {
  const { userId } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setStatus('loading');
    try {
      const res = await addCharacters(userId, trimmed);
      setStatus('success');
      setMessage(res.message);
      setInput('');
      onCharactersAdded?.();
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to add characters');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const statusStyles: Record<string, string> = {
    idle: 'border-black',
    loading: 'border-[#e8d44d] bg-[#e8d44d]/10',
    success: 'border-[#7bc47f] bg-[#7bc47f]/10',
    error: 'border-[#e07b7b] bg-[#e07b7b]/10',
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste Chinese text to scan..."
          className={`retro-input flex-1 ${statusStyles[status]}`}
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !input.trim()}
          className="retro-btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'SCANNING...' : '🔍 SCAN'}
        </button>
      </div>
      {message && status !== 'idle' && (
        <p className={`font-mono text-[10px] mt-2 ${
          status === 'success' ? 'text-[#27ae60]' : 'text-[#e74c3c]'
        }`}>
          [{status.toUpperCase()}] {message}
        </p>
      )}
    </form>
  );
}
