import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrivacyPolicy({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    // Blokuj scroll body w trakcie modal'a.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-5 border-b-2 border-slate-100">
          <h2 id="privacy-heading" className="text-xl sm:text-2xl font-black text-slate-900">
            🔒 Polityka prywatności
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-soft px-3 min-w-[48px]"
            aria-label="Zamknij politykę prywatności"
          >
            <span aria-hidden>✕</span>
          </button>
        </header>

        <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5 text-slate-900 text-sm sm:text-base leading-relaxed">
          <section>
            <p className="text-slate-700">
              Aplikacja <strong>„5 Sekund"</strong> jest rodzinną grą działającą w całości
              w Twojej przeglądarce. Poniżej wyjaśniamy, jakie dane przetwarza i jakie masz
              prawa zgodnie z RODO.
            </p>
          </section>

          <section>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              📋 Jakie dane są przechowywane
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-800">
              <li><strong>Imiona graczy</strong>, które wpiszesz przy dodawaniu gracza.</li>
              <li><strong>Wiek</strong> graczy (5–16 lat lub „dorosły") — używany tylko do dopasowania trudności haseł.</li>
              <li><strong>Ustawienia partii</strong>: czas, bonusy dla młodszych, kategorie, próg zwycięstwa, tempo lektora, wyciszenie.</li>
              <li><strong>Historię wylosowanych haseł</strong> — żeby w kolejnej partii nie powtarzały się te same.</li>
              <li><strong>Aktualne wyniki</strong> trwającej partii.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              💾 Gdzie te dane są przechowywane
            </h3>
            <p className="text-slate-800">
              <strong>Wyłącznie na Twoim urządzeniu</strong>, w lokalnej pamięci przeglądarki
              (<code className="bg-slate-100 px-1 rounded">localStorage</code>). Dane nie są
              wysyłane na żaden serwer, nie używamy plików cookie do śledzenia, nie zbieramy
              statystyk i nie korzystamy z usług analitycznych (np. Google Analytics).
            </p>
            <p className="text-slate-800 mt-2">
              Jedyne zewnętrzne zasoby ładowane przez aplikację to <strong>czcionka Nunito</strong>{' '}
              z Google Fonts — Google może odnotować Twój adres IP, ale nie otrzymuje żadnych
              Twoich danych z gry.
            </p>
          </section>

          <section>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              👶 Dane dzieci
            </h3>
            <p className="text-slate-800">
              Aplikacja jest przeznaczona do wspólnej zabawy rodzinnej. Jeśli wpisujesz imię
              i wiek dziecka, robisz to <strong>jako rodzic lub opiekun prawny</strong>
              (zgodnie z art. 8 RODO).
            </p>
            <p className="text-slate-800 mt-2">
              Polecamy używać <strong>tylko imion</strong> (bez nazwisk) i nie wpisywać innych
              danych identyfikujących. Dane pozostają fizycznie tylko na Twoim urządzeniu i
              znikają, gdy:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-800 mt-1">
              <li>klikniesz „Wyczyść wszystkie dane" na ekranie startowym,</li>
              <li>wyczyścisz dane przeglądarki dla tej strony,</li>
              <li>odinstalujesz aplikację PWA z urządzenia.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              ⚖️ Twoje prawa
            </h3>
            <p className="text-slate-800 mb-2">W każdej chwili możesz:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-800">
              <li>
                <strong>Usunąć pojedynczego gracza</strong> — przycisk <span aria-hidden>✕</span>{' '}
                przy każdym graczu w sekcji „Gracze".
              </li>
              <li>
                <strong>Wyczyścić historię haseł</strong> — przycisk 🗑 w sekcji „Historia haseł"
                (pojawia się, gdy historia jest niepusta).
              </li>
              <li>
                <strong>Przywrócić ustawienia domyślne</strong> — link w sekcji „Ustawienia partii".
              </li>
              <li>
                <strong>Wyczyścić wszystkie dane</strong> — przycisk na dole ekranu startowego
                (usuwa graczy, ustawienia i historię).
              </li>
            </ul>
            <p className="text-slate-800 mt-2">
              Ponieważ dane nie opuszczają Twojego urządzenia, nie ma potrzeby kontaktować się
              z nikim, by je usunąć — robisz to sam(a) za pomocą powyższych przycisków.
            </p>
          </section>

          <section>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              🛡️ Administrator danych
            </h3>
            <p className="text-slate-800">
              Twórca aplikacji <strong>nie ma technicznej możliwości dostępu do Twoich danych</strong>
              — pozostają one wyłącznie na Twoim urządzeniu. W praktyce administratorem
              przetwarzanych w gospodarstwie domowym danych jesteś <strong>Ty</strong>.
            </p>
            <p className="text-slate-800 mt-2">
              Aplikacja udostępniana jest jako kod open‑source na GitHubie. W razie wątpliwości
              lub błędu zgłoś przez:{' '}
              <a
                href="https://github.com/Ignotus2023/5_sekund/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-brand-700 hover:text-brand-800"
              >
                github.com/Ignotus2023/5_sekund/issues
              </a>
            </p>
          </section>

          <section>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              🔄 Zmiany polityki
            </h3>
            <p className="text-slate-800">
              Polityka może być aktualizowana wraz z rozwojem aplikacji. Data ostatniej
              aktualizacji znajduje się poniżej. Istotne zmiany zaznaczymy w aktualizacji aplikacji.
            </p>
          </section>

          <section className="border-t-2 border-slate-100 pt-4 text-xs text-slate-600">
            <p>
              <strong>Data ostatniej aktualizacji:</strong> 15 czerwca 2026 r.
            </p>
            <p className="mt-1">
              <strong>Wersja:</strong> 1.0
            </p>
          </section>
        </div>

        <footer className="p-4 border-t-2 border-slate-100 flex justify-end">
          <button onClick={onClose} className="btn-primary px-6">
            Rozumiem
          </button>
        </footer>
      </div>
    </div>
  );
}
