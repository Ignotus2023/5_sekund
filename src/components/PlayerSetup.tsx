import { useState } from 'react';
import type { Player, GameSettings, Tier } from '../types';
import { TIERS, TIER_LABEL, describeAge, tierOf } from '../lib/tier';
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

export function PlayerSetup({ players, setPlayers, settings, setSettings, onStart }: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | 'dorosly'>(8);

  const addPlayer = () => {
    const trimmed = name.trim();
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

  const canStart = players.length >= 1;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in">
      <header className="text-center pt-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-brand-600 to-fuchsia-500 bg-clip-text text-transparent">
            5 Sekund
          </span>
        </h1>
        <p className="text-slate-600 mt-2">Rodzinna gra — wymień 3 rzeczy w 5 sekund!</p>
      </header>

      <section className="card">
        <h2 className="text-xl font-extrabold mb-3">Gracze</h2>

        <div className="space-y-2 mb-4">
          {players.length === 0 && (
            <p className="text-slate-500 text-sm italic">Dodaj przynajmniej jednego gracza.</p>
          )}
          {players.map((p) => {
            const takenEmojis = players.filter((x) => x.id !== p.id).map((x) => x.emoji);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl p-3 border-2"
                style={{ borderColor: p.color + '55', background: p.color + '11' }}
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
                  onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
                  aria-label="Imię gracza"
                />
                <select
                  className="input w-28"
                  value={p.age === 'dorosly' ? 'dorosly' : String(p.age)}
                  onChange={(e) =>
                    updatePlayer(p.id, {
                      age: e.target.value === 'dorosly' ? 'dorosly' : Number(e.target.value),
                    })
                  }
                  aria-label="Wiek gracza"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
                    <option key={a} value={a}>{a} lat</option>
                  ))}
                  <option value="dorosly">Dorosły</option>
                </select>
                <button
                  className="btn-soft px-3"
                  onClick={() => removePlayer(p.id)}
                  aria-label={`Usuń gracza ${p.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input flex-1"
            placeholder="Imię gracza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <select
            className="input w-full sm:w-32"
            value={age === 'dorosly' ? 'dorosly' : String(age)}
            onChange={(e) =>
              setAge(e.target.value === 'dorosly' ? 'dorosly' : Number(e.target.value))
            }
          >
            {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
              <option key={a} value={a}>{a} lat</option>
            ))}
            <option value="dorosly">Dorosły</option>
          </select>
          <button className="btn-primary" onClick={addPlayer} disabled={!name.trim()}>
            ➕ Dodaj
          </button>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-xl font-extrabold">Ustawienia partii</h2>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Próg zwycięstwa</label>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 0].map((v) => (
              <button
                key={v}
                onClick={() => setSettings({ ...settings, winScore: v })}
                className={`btn ${settings.winScore === v ? 'btn-primary' : 'btn-soft'}`}
              >
                {v === 0 ? 'Swobodny' : `${v} pkt`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Czas bazowy</label>
          <div className="flex flex-wrap gap-2">
            {[3, 5, 7, 10].map((v) => (
              <button
                key={v}
                onClick={() =>
                  setSettings({ ...settings, time: { ...settings.time, baseSeconds: v } })
                }
                className={`btn ${settings.time.baseSeconds === v ? 'btn-primary' : 'btn-soft'}`}
              >
                {v} s
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-bold text-slate-700">
              Dodatkowy czas dla młodszych
            </label>
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
              <span className="text-sm">Włączone</span>
            </label>
          </div>
          <div className={`space-y-2 ${settings.time.handicapEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            {TIERS.map((tier) => (
              <div key={tier} className="flex items-center gap-3">
                <div className="w-24 text-sm font-semibold">{TIER_LABEL[tier]}</div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={settings.time.bonusByTier[tier]}
                  onChange={(e) => setBonus(tier, Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <div className="w-14 text-right tabular-nums font-bold">
                  +{settings.time.bonusByTier[tier]} s
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Tempo lektora: <span className="tabular-nums">{settings.speechRate.toFixed(2)}×</span>
          </label>
          <input
            type="range"
            min={0.6}
            max={1.3}
            step={0.05}
            value={settings.speechRate}
            onChange={(e) => setSettings({ ...settings, speechRate: Number(e.target.value) })}
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
          <span className="font-semibold">🔇 Wycisz dźwięki i lektora</span>
        </label>
      </section>

      <section className="card">
        <CategorySelector
          selected={settings.selectedCategories}
          onChange={(cats) => setSettings({ ...settings, selectedCategories: cats })}
        />
      </section>

      {players.length > 0 && (
        <section className="card">
          <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase">Podgląd czasu</h3>
          <ul className="text-sm space-y-1">
            {players.map((p) => {
              const tier = tierOf(p.age);
              const bonus = settings.time.handicapEnabled ? settings.time.bonusByTier[tier] : 0;
              return (
                <li key={p.id} className="flex items-center gap-2">
                  <span style={{ color: p.color }} className="font-bold">{p.emoji} {p.name}</span>
                  <span className="text-slate-500">({describeAge(p.age)})</span>
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
    </div>
  );
}
