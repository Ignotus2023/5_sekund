interface Props {
  count: number;
  onReset: () => void;
}

export function HistorySection({ count, onReset }: Props) {
  if (count === 0) return null;
  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3
            id="history-heading"
            className="font-bold text-slate-800 text-sm uppercase"
          >
            Historia haseł
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Pamiętam <strong>{count}</strong>{' '}
            {count === 1 ? 'wylosowane hasło' : 'wylosowanych haseł'} z poprzednich
            partii — w kolejnej rundzie nie wyjdą ponownie.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="btn-soft text-sm whitespace-nowrap"
        >
          🗑 Wyczyść
        </button>
      </div>
    </section>
  );
}
