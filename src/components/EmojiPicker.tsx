import { useEffect, useRef, useState } from 'react';
import { PLAYER_EMOJIS } from '../lib/utils';

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  taken?: string[]; // emoji już zajęte przez innych graczy (wyszarzone)
  color?: string;
  label?: string;
}

export function EmojiPicker({ value, onChange, taken = [], color = '#7c3aed', label }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handlePick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label ?? 'Wybierz ikonkę'}
        className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition active:scale-95"
        style={{
          borderColor: open ? color : `${color}55`,
          background: `${color}11`,
        }}
      >
        {value}
      </button>
      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border-2 p-2"
          style={{ borderColor: `${color}55` }}
        >
          <div className="grid grid-cols-6 gap-1 w-[280px]">
            {PLAYER_EMOJIS.map((e) => {
              const isTaken = taken.includes(e) && e !== value;
              const isCurrent = e === value;
              return (
                <button
                  key={e}
                  type="button"
                  disabled={isTaken}
                  onClick={() => handlePick(e)}
                  className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-90
                    ${isCurrent ? 'ring-2 ring-offset-1' : ''}
                    ${isTaken ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                  style={isCurrent ? { background: `${color}22`, ['--tw-ring-color' as string]: color } : undefined}
                  title={isTaken ? 'Już wybrane przez innego gracza' : undefined}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
