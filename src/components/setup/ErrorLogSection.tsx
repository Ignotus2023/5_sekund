import { useState } from 'react';
import { clearErrors, getErrors, type ErrorEntry } from '../../lib/errorLog';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('pl-PL');
}

function formatForCopy(entries: ErrorEntry[]): string {
  return entries
    .map(
      (e, i) =>
        `#${i + 1} [${formatDate(e.timestamp)}] (${e.source})\n` +
        `Komunikat: ${e.message}\n` +
        (e.stack ? `Stos:\n${e.stack}\n` : '') +
        (e.url ? `URL: ${e.url}\n` : '') +
        (e.userAgent ? `User-Agent: ${e.userAgent}\n` : '') +
        '---',
    )
    .join('\n');
}

export function ErrorLogSection() {
  const [entries, setEntries] = useState<ErrorEntry[]>(() => getErrors());
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  const refresh = () => setEntries(getErrors());

  const handleClear = () => {
    if (!confirm(`Wyczyścić ${entries.length} ${entries.length === 1 ? 'wpis' : 'wpisy'} dziennika błędów?`)) {
      return;
    }
    clearErrors();
    refresh();
  };

  const handleCopy = async () => {
    const text = formatForCopy(entries);
    try {
      await navigator.clipboard.writeText(text);
      alert('Dziennik skopiowany do schowka.');
    } catch {
      // Fallback dla starszych przeglądarek / odmowy uprawnień.
      prompt('Skopiuj poniższy tekst ręcznie:', text);
    }
  };

  return (
    <section className="card border-2 border-amber-200 bg-amber-50/60" aria-labelledby="error-log-heading">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 id="error-log-heading" className="font-bold text-slate-900 text-sm uppercase">
            ⚠️ Dziennik błędów
          </h3>
          <p className="text-xs text-slate-700 mt-1">
            Zapisano <strong>{entries.length}</strong>{' '}
            {entries.length === 1 ? 'wpis' : 'wpisów'}. Dane lokalne — nie wysyłamy na żaden serwer.
          </p>
        </div>
        <span aria-hidden className="text-slate-500">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-2 max-h-72 overflow-y-auto text-xs">
            {entries
              .slice()
              .reverse()
              .map((e, i) => (
                <li
                  key={`${e.timestamp}-${i}`}
                  className="rounded-lg p-2 bg-white border border-amber-200"
                >
                  <div className="font-bold text-slate-900">
                    [{e.source}] {formatDate(e.timestamp)}
                  </div>
                  <div className="text-slate-700 mt-1 break-all">{e.message}</div>
                </li>
              ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCopy} className="btn-soft text-sm">
              📋 Kopiuj do schowka
            </button>
            <button type="button" onClick={handleClear} className="btn-danger text-sm">
              🗑 Wyczyść dziennik
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
