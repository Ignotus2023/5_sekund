interface Props {
  onShowPolicy: () => void;
  onEraseAll: () => void;
}

export function PrivacySection({ onShowPolicy, onEraseAll }: Props) {
  return (
    <>
      <section
        className="card border-2 border-rose-200 bg-rose-50/60"
        aria-labelledby="privacy-section-heading"
      >
        <h3
          id="privacy-section-heading"
          className="font-bold text-slate-900 text-sm uppercase mb-2"
        >
          🔒 Twoje dane i prywatność
        </h3>
        <p className="text-xs text-slate-700 mb-3 leading-relaxed">
          Wszystkie dane (imiona graczy, wiek, ustawienia, historia haseł) są
          przechowywane wyłącznie na Twoim urządzeniu i nigdzie nie są wysyłane.
          Możesz w każdej chwili je przejrzeć, edytować lub usunąć.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onShowPolicy} className="btn-soft text-sm">
            📄 Polityka prywatności
          </button>
          <button type="button" onClick={onEraseAll} className="btn-danger text-sm">
            🗑 Wyczyść wszystkie dane
          </button>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-600 pt-1">
        <p>
          „5 Sekund" · rodzinna gra ·{' '}
          <button
            type="button"
            onClick={onShowPolicy}
            className="underline hover:text-slate-900"
          >
            Polityka prywatności
          </button>
        </p>
      </footer>
    </>
  );
}
