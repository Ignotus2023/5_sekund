import { useEffect, useId, useRef, useState } from 'react';
import { PLAYER_EMOJIS } from '../lib/utils';

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  taken?: string[]; // emoji już zajęte przez innych graczy (wyszarzone)
  color?: string;
  label?: string;
}

export function EmojiPicker({
  value,
  onChange,
  taken = [],
  color = '#7c3aed',
  label,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const dialogId = useId();

  const takenSet = new Set(taken);

  useEffect(() => {
    if (!open) return;

    // Focus na pierwszą dostępną opcję po otwarciu.
    const first = popoverRef.current?.querySelector<HTMLButtonElement>(
      'button[data-emoji]:not([disabled])',
    );
    first?.focus();

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      // Prosty focus trap: Tab nie wychodzi poza popover.
      if (e.key === 'Tab') {
        const buttons = Array.from(
          popoverRef.current?.querySelectorAll<HTMLButtonElement>(
            'button[data-emoji]:not([disabled])',
          ) ?? [],
        );
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first || !last) return;
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handlePick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    // Po wyborze focus wraca na trigger.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label ?? 'Wybierz ikonkę'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition active:scale-95 relative"
        style={{
          borderColor: open ? color : `${color}55`,
          background: `${color}11`,
        }}
      >
        <span aria-hidden>{value}</span>
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shadow-sm"
          style={{ color }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          ref={popoverRef}
          id={dialogId}
          role="dialog"
          aria-modal="false"
          aria-label="Wybór ikonki gracza"
          className="absolute z-50 top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border-2 p-2"
          style={{ borderColor: `${color}55` }}
        >
          <div className="grid grid-cols-6 gap-1 w-[288px]">
            {PLAYER_EMOJIS.map((e) => {
              const isTaken = takenSet.has(e) && e !== value;
              const isCurrent = e === value;
              return (
                <button
                  key={e}
                  type="button"
                  data-emoji
                  disabled={isTaken}
                  onClick={() => handlePick(e)}
                  aria-pressed={isCurrent}
                  aria-label={
                    isTaken
                      ? `${e} (już wybrane przez innego gracza)`
                      : `${e}${isCurrent ? ' (aktualny wybór)' : ''}`
                  }
                  className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                    ${isCurrent ? 'ring-2 ring-offset-1' : ''}
                    ${isTaken ? 'opacity-25 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                  style={
                    isCurrent
                      ? ({
                          background: `${color}22`,
                          '--tw-ring-color': color,
                        } as React.CSSProperties & Record<string, string>)
                      : undefined
                  }
                >
                  <span aria-hidden>{e}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
