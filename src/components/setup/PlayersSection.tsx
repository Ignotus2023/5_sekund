import { useId, useState } from 'react';
import type { Player } from '../../types';
import { nextColor, nextEmoji, uid } from '../../lib/utils';
import { SortablePlayerList } from '../SortablePlayerList';

interface Props {
  players: Player[];
  setPlayers: (
    players: Player[] | ((prev: Player[]) => Player[]),
  ) => void;
}

export function PlayersSection({ players, setPlayers }: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | 'dorosly'>(8);
  const newNameId = useId();
  const newAgeId = useId();

  const addPlayer = () => {
    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) return;
    setPlayers((prev) => {
      const newPlayer: Player = {
        id: uid(),
        name: trimmed,
        age,
        score: 0,
        color: nextColor(prev.map((p) => p.color)),
        emoji: nextEmoji(prev.map((p) => p.emoji)),
      };
      return [...prev, newPlayer];
    });
    setName('');
  };

  return (
    <section className="card" aria-labelledby="players-heading">
      <h2 id="players-heading" className="text-xl font-extrabold mb-3 text-slate-900">
        Gracze
      </h2>

      <div className="space-y-2 mb-4">
        {players.length === 0 && (
          <p className="text-slate-600 text-sm italic">
            Dodaj przynajmniej jednego gracza, żeby zacząć.
          </p>
        )}
        <SortablePlayerList players={players} setPlayers={setPlayers} />
        {players.length >= 2 && (
          <p className="text-xs text-slate-600 italic pl-1">
            Wskazówka: przeciągnij <span aria-hidden>⠿</span> obok gracza, by zmienić
            kolejność tur.
          </p>
        )}
      </div>

      <div className="border-t-2 border-slate-100 pt-3">
        <div className="text-sm font-bold text-slate-700 mb-2">Dodaj nowego gracza</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor={newNameId} className="sr-only">
            Imię nowego gracza
          </label>
          <input
            id={newNameId}
            className="input flex-1"
            placeholder="Imię gracza"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <label htmlFor={newAgeId} className="sr-only">
            Wiek nowego gracza
          </label>
          <select
            id={newAgeId}
            className="input w-full sm:w-32"
            value={age === 'dorosly' ? 'dorosly' : String(age)}
            onChange={(e) =>
              setAge(
                e.target.value === 'dorosly' ? 'dorosly' : Number(e.target.value),
              )
            }
          >
            {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
              <option key={a} value={a}>
                {a} lat
              </option>
            ))}
            <option value="dorosly">Dorosły</option>
          </select>
          <button
            className="btn-primary"
            onClick={addPlayer}
            disabled={!name.trim()}
          >
            ➕ Dodaj
          </button>
        </div>
      </div>
    </section>
  );
}
