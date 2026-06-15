import type { Prompt } from '../../types';
import { CATEGORY_BY_KEY } from '../../lib/categories';

interface Props {
  prompt: Prompt | null;
  ttsAvailable: boolean;
}

export function PromptCard({ prompt, ttsAvailable }: Props) {
  return (
    <section
      className="card flex-1 flex flex-col items-center justify-center text-center py-8 min-h-[180px]"
      aria-label="Hasło do odgadnięcia"
    >
      {prompt ? (
        <div
          key={prompt.id}
          className="animate-pop-in"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="text-3xl sm:text-5xl font-black leading-tight px-2 text-slate-900">
            {prompt.text}
          </div>
          {CATEGORY_BY_KEY[prompt.category] && (
            <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide">
              <span aria-hidden>{CATEGORY_BY_KEY[prompt.category].emoji}</span>
              <span>{CATEGORY_BY_KEY[prompt.category].label}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-600">Brak haseł.</div>
      )}
      {!ttsAvailable && (
        <div
          className="mt-3 text-xs font-bold text-amber-800 bg-amber-100 rounded-lg px-2 py-1"
          role="note"
        >
          Lektor pl-PL niedostępny — przeczytaj hasło sam(a).
        </div>
      )}
    </section>
  );
}
