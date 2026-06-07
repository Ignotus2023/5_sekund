import { useId, useState } from 'react';
import type { Player, GameSettings, Tier } from '../types';
import { TIERS, TIER_LABEL, describeAge, tierOf, DEFAULT_BONUS } from '../lib/tier';
import { nextColor, nextEmoji, uid } from '../lib/utils';
import { CategorySelector } from './CategorySelector';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  onStart: () => void;
}

const WIN_SCORES = [5, 10, 15, 0] as const;
const BASE_SECONDS = [3, 5, 7, 10] as const;

export function PlayerSetup({
  players,
  setPlayers,
  settings,
  setSettings,
  onStart,
}: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | 'dorosly'>(8);
  const [handicapOpen, setHandicapOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const nameId = useId();
  const ageId = useId();
  const newNameId = useId();
  const newAgeId = useId();
  const speechRateId = useId();

  const addPlayer = () => {
    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) return;
    const usedColors = players.map((p) => p.color);
    const usedEmojis = players.map((p) => p.emoji);
    const newPlayer: Player = {
      id: uid(),
      name: trimmed,
      age,
      score: 0,
      color: nextColor(usedColors),
      emoji: nextEmoji(usedEmojis),
    };
    setPlayers([...players, newPlayer]);
    setName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const updatePlayer = (id: string, patch: Partial<Player>) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const setBonus = (tier: Tier, value: number) => {
    setSettings({
      ...settings,
      time: {
        ...settings.time,
        bonusByTier: { ...settings.time.bonusByTier, [tier]: value },
      },
    });
  };

  const resetSettings = () => {
    if (!confirm('Przywrócić domyślne ustawienia partii?')) return;
    setSettings({
      time: {
        baseSeconds: 5,
        handicapEnabled: true,
        bonusByTier: { ...DEFAULT_BONUS },
      },
      winScore: 10,
      speechRate: 0.95,
      muted: false,
      selectedCategories: [],
    });
  };

  const canStart = players.length >= 1;

  const handicapSummary = TIERS.filter((t) => settings.time.bonusByTier[t] > 0)
    .map((t) => `${TIER_LABEL[t]}: +${settings.time.bonusByTier[t]}s`)
    .join(', ');

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in" aria-label="Konfiguracja partii">
      <header className="text-center pt-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-brand-700 to-fuchsia-600 bg-clip-text text-transparent">
            5 Sekund
          </span>
        </h1>
        <p className="text-slate-700 mt-2">Rodzinna gra — wymień 3 rzeczy w 5 sekund!</p>
      </header>

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
          {players.map((p) => {
            const takenEmojis = players.filter((x) => x.id !== p.id).map((x) => x.emoji);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl p-3 border-2"
                style={{ borderColor: p.color + '88', background: p.color + '11' }}
              >
                <EmojiPicker
                  value={p.emoji}
                  onChange={(emoji) => updatePlayer(p.id, { emoji })}
                  taken={takenEmojis}
                  color={p.color}
                  label={`Zmień ikonkę gracza ${p.name}`}
                />
                <input
                  className="input flex-1 min-w-0"
                  value={p.name}
                  maxLength={24}
                  onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
                  aria-label={`Imię gracza ${p.name}`}
                />
                <select
                  className="input w-28"
                  value={p.age === 'dorosly' ? 'dorosly' : String(p.age)}
                  onChange={(e) =>
                    updatePlayer(p.id, {
                      age:
                        e.target.value === 'dorosly'
                          ? 'dorosly'
                          : Number(e.target.value),
                    })
                  }
                  aria-label={`Wiek gracza ${p.name}`}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
                    <option key={a} value={a}>
                      {a} lat
                    </option>
                  ))}
                  <option value="dorosly">Dorosły</option>
                </select>
                <button
                  className="btn-soft px-3 min-w-[48px]"
                  onClick={() => removePlayer(p.id)}
                  aria-label={`Usuń gracza ${p.name}`}
                >
                  <span aria-hidden>✕</span>
                </button>
              </div>
            );
          })}
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
                setAge(e.target.value === 'dorosly' ? 'dorosly' : Number(e.target.value))
              }
            >
              {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
                <option key={a} value={a}>
                  {a} lat
                </option>
              ))}
              <option value="dorosly">Dorosły</option>
            </select>
            <button className="btn-primary" onClick={addPlayer} disabled={!name.trim()}>
              ➕ Dodaj
            </button>
          </div>
        </div>
      </section>

      <section className="card space-y-5" aria-labelledby="settings-heading">
        <div className="flex items-center justify-between">
          <h2 id="settings-heading" className="text-xl font-extrabold text-slate-900">
            Ustawienia partii
          </h2>
          <button
            type="button"
            onClick={resetSettings}
            className="text-xs underline text-slate-600 hover:text-slate-900"
          >
            Przywróć domyślne
          </button>
        </div>

        <fieldset>
          <legend id={nameId} className="block text-sm font-bold text-slate-800 mb-1">
            Próg zwycięstwa
          </legend>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-labelledby={nameId}
          >
            {WIN_SCORES.map((v) => {
              const active = settings.winScore === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSettings({ ...settings, winScore: v })}
                  className={`btn ${active ? 'btn-primary' : 'btn-soft'}`}
                >
                  {v === 0 ? 'Swobodny' : `${v} pkt`}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Tryb swobodny = gra trwa do ręcznego zakończenia 🏁.
          </p>
        </fieldset>

        <fieldset>
          <legend id={ageId} className="block text-sm font-bold text-slate-800 mb-1">
            Czas bazowy
          </legend>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-labelledby={ageId}
          >
            {BASE_SECONDS.map((v) => {
              const active = settings.time.baseSeconds === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    setSettings({ ...settings, time: { ...settings.time, baseSeconds: v } })
                  }
                  className={`btn ${active ? 'btn-primary' : 'btn-soft'}`}
                >
                  {v} s
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="border-t-2 border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setHandicapOpen((o) => !o)}
            aria-expanded={handicapOpen}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-bold text-slate-800">
              Dodatkowy czas dla młodszych
              {settings.time.handicapEnabled && handicapSummary && (
                <span className="ml-2 text-xs font-normal text-slate-600">
                  ({handicapSummary})
                </span>
              )}
              {!settings.time.handicapEnabled && (
                <span className="ml-2 text-xs font-normal text-slate-600">(wyłączone)</span>
              )}
            </span>
            <span aria-hidden className="text-slate-500">
              {handicapOpen ? '▴' : '▾'}
            </span>
          </button>
          {handicapOpen && (
            <div className="mt-3 space-y-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.time.handicapEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      time: { ...settings.time, handicapEnabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-brand-600"
                />
                <span className="text-sm font-semibold text-slate-800">Doliczaj bonus</span>
              </label>
              <div
                className={`space-y-2 ${
                  settings.time.handicapEnabled ? '' : 'opacity-50 pointer-events-none'
                }`}
              >
                {TIERS.map((tier) => {
                  const value = settings.time.bonusByTier[tier] ?? 0;
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <label
                        htmlFor={`bonus-${tier}`}
                        className="w-24 text-sm font-semibold text-slate-800"
                      >
                        {TIER_LABEL[tier]}
                      </label>
                      <input
                        id={`bonus-${tier}`}
                        type="range"
                        min={0}
                        max={10}
                        value={value}
                        onChange={(e) => setBonus(tier, Number(e.target.value))}
                        className="flex-1 accent-brand-600"
                        aria-valuetext={`+${value} sekund`}
                      />
                      <div className="w-14 text-right tabular-nums font-bold text-slate-900">
                        +{value} s
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor={speechRateId} className="block text-sm font-bold text-slate-800 mb-1">
            Tempo lektora:{' '}
            <span className="tabular-nums">{settings.speechRate.toFixed(2)}×</span>
          </label>
          <input
            id={speechRateId}
            type="range"
            min={0.6}
            max={1.3}
            step={0.05}
            value={settings.speechRate}
            onChange={(e) =>
              setSettings({ ...settings, speechRate: Number(e.target.value) })
            }
            className="w-full accent-brand-600"
          />
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(e) => setSettings({ ...settings, muted: e.target.checked })}
            className="w-5 h-5 accent-brand-600"
          />
          <span className="font-semibold text-slate-800">🔇 Wycisz dźwięki i lektora</span>
        </label>
      </section>

      <section className="card" aria-labelledby="categories-heading">
        <button
          type="button"
          onClick={() => setCategoriesOpen((o) => !o)}
          aria-expanded={categoriesOpen}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 id="categories-heading" className="text-xl font-extrabold text-slate-900">
            Kategorie haseł
            <span className="ml-2 text-xs font-normal text-slate-600">
              ({settings.selectedCategories.length === 0
                ? 'wszystkie'
                : `wybrane: ${settings.selectedCategories.length}`})
            </span>
          </h2>
          <span aria-hidden className="text-slate-500">
            {categoriesOpen ? '▴' : '▾'}
          </span>
        </button>
        {categoriesOpen && (
          <div className="mt-3">
            <CategorySelector
              selected={settings.selectedCategories}
              onChange={(cats) =>
                setSettings({ ...settings, selectedCategories: cats })
              }
            />
          </div>
        )}
      </section>

      {players.length > 0 && (
        <section className="card" aria-labelledby="preview-heading">
          <h3
            id="preview-heading"
            className="font-bold text-slate-800 mb-2 text-sm uppercase"
          >
            Podgląd czasu
          </h3>
          <ul className="text-sm space-y-1">
            {players.map((p) => {
              const tier = tierOf(p.age);
              const bonus = settings.time.handicapEnabled
                ? settings.time.bonusByTier[tier] ?? 0
                : 0;
              return (
                <li key={p.id} className="flex items-center gap-2 text-slate-900">
                  <span className="font-bold">
                    <span aria-hidden>{p.emoji} </span>
                    {p.name}
                  </span>
                  <span className="text-slate-600">({describeAge(p.age)})</span>
                  <span className="ml-auto tabular-nums font-bold">
                    ⏱ {settings.time.baseSeconds + bonus} s
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="sticky bottom-3">
        <button
          onClick={onStart}
          disabled={!canStart}
          className="btn-primary w-full text-lg py-4"
        >
          ▶ Start gry
        </button>
      </div>
    </main>
  );
}
