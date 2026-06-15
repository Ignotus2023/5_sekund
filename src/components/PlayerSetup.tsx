import { useState } from 'react';
import type { Player, GameSettings } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { PrivacyPolicy } from './PrivacyPolicy';
import { PlayersSection } from './setup/PlayersSection';
import { SettingsSection } from './setup/SettingsSection';
import { CategoriesSection } from './setup/CategoriesSection';
import { HistorySection } from './setup/HistorySection';
import { PreviewSection } from './setup/PreviewSection';
import { PrivacySection } from './setup/PrivacySection';
import { ErrorLogSection } from './setup/ErrorLogSection';

interface Props {
  players: Player[];
  // Szerszy podpis (akceptuje funkcyjny update), żeby podkomponenty mogły
  // używać `setPlayers(prev => ...)` bez deps na bieżącej tablicy.
  setPlayers: (players: Player[] | ((prev: Player[]) => Player[])) => void;
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  onStart: () => void;
}

// Klucze localStorage używane przez aplikację — utrzymujemy w jednym miejscu,
// żeby "Wyczyść wszystkie dane" mógł je celowo usunąć (nie ruszając danych
// innych aplikacji z tego samego origin).
const APP_STORAGE_KEYS = [
  'players',
  'settings',
  'used-prompt-texts',
  'error-log',
] as const;

export function PlayerSetup({
  players,
  setPlayers,
  settings,
  setSettings,
  onStart,
}: Props) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [usedTexts, setUsedTexts] = usePersistedState<string[]>(
    'used-prompt-texts',
    [],
  );

  const resetUsedTexts = () => {
    if (
      !confirm(
        `Wyczyścić historię ${usedTexts.length} wylosowanych haseł? Kolejna partia będzie mogła pokazać je od nowa.`,
      )
    ) {
      return;
    }
    setUsedTexts([]);
  };

  // RODO art. 17 (prawo do usunięcia) — usuwa tylko klucze tej aplikacji,
  // nie `localStorage.clear()`, żeby nie ruszać danych innych aplikacji pod
  // tym samym originem (GitHub Pages współdzieli localStorage między
  // <user>.github.io/*).
  const eraseEverything = () => {
    const playerCount = players.length;
    const totalUsed = usedTexts.length;
    if (
      !confirm(
        `⚠ UWAGA — to usunie WSZYSTKIE dane aplikacji:\n\n` +
          `• ${playerCount} ${playerCount === 1 ? 'gracza' : 'graczy'}\n` +
          `• ustawienia partii (czas, kategorie, próg zwycięstwa)\n` +
          `• historię ${totalUsed} ${totalUsed === 1 ? 'wylosowanego hasła' : 'wylosowanych haseł'}\n\n` +
          `Aplikacja przeładuje się ze stanem fabrycznym. Operacja jest nieodwracalna.\n\n` +
          `Kontynuować?`,
      )
    ) {
      return;
    }
    try {
      APP_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const canStart = players.length >= 1;

  return (
    <main
      className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in"
      aria-label="Konfiguracja partii"
    >
      <header className="text-center pt-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-brand-700 to-fuchsia-600 bg-clip-text text-transparent">
            5 Sekund
          </span>
        </h1>
        <p className="text-slate-700 mt-2">
          Rodzinna gra — wymień 3 rzeczy w 5 sekund!
        </p>
      </header>

      <PlayersSection players={players} setPlayers={setPlayers} />

      <SettingsSection settings={settings} setSettings={setSettings} />

      <CategoriesSection
        selected={settings.selectedCategories}
        onChange={(cats) =>
          setSettings({ ...settings, selectedCategories: cats })
        }
      />

      <HistorySection count={usedTexts.length} onReset={resetUsedTexts} />

      <ErrorLogSection />

      <PreviewSection players={players} settings={settings} />

      <div className="sticky bottom-3">
        <button
          onClick={onStart}
          disabled={!canStart}
          className="btn-primary w-full text-lg py-4"
        >
          ▶ Start gry
        </button>
      </div>

      <PrivacySection
        onShowPolicy={() => setPrivacyOpen(true)}
        onEraseAll={eraseEverything}
      />

      <PrivacyPolicy open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </main>
  );
}
