# Architektura — 5 Sekund

Dokument dla nowych deweloperów + utrzymaniowców. Opisuje wzorce zastosowane w kodzie, dlaczego zostały wybrane i kiedy je powielać przy nowych funkcjach.

> Status: aktualny na 2026‑06‑15. Aktualizować przy każdej zmianie warstwowej.

---

## 1. Mapa wysokopoziomowa

```
┌──────────────────────────────────────────────────────────┐
│ main.tsx                                                 │
│  ├─ installGlobalErrorLog()  ← listenery window error    │
│  └─ <StrictMode><ErrorBoundary><App/></ErrorBoundary>... │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼ screen: 'setup' | 'play' | 'result'
        ┌───────────────────┴────────────────────┐
        ▼                   ▼                    ▼
    PlayerSetup         GameScreen           ResultScreen
   ┌─ PlayersSection   ─ useTurn (hook)     ─ confetti
   │  └ SortablePlayer   ├── useTimer        ─ aria-live winner
   │     List            ├── useSpeech       ─ focus na <h1>
   ├─ SettingsSection    ├── useAudio
   │  └ HandicapSection  └── usePersisted
   ├─ CategoriesSection      State
   ├─ HistorySection    ─ HandoffPanel
   ├─ PreviewSection    ─ PlayerBanner
   ├─ PrivacySection    ─ PromptCard
   └─ ErrorLogSection   ─ TurnControls
                        ─ ScoreAdjustPanel
                        ─ CountdownRing
                        ─ ScoreBoard

src/lib/      pure logic (tier, categories, sanitize, utils, errorLog)
src/data/     prompts.ts (783 hasła w 16 kategoriach × 6 poziomach)
```

---

## 2. Kluczowe wzorce architektoniczne

### 2.1. Maszyna stanów wyniesiona do hooka (`useTurn`)

```ts
type Phase = 'handoff' | 'ready' | 'running' | 'judged' | 'paused';

const turn = useTurn({ players, settings, onScore });
// turn.phase, turn.currentPrompt, turn.judge(true|false), turn.skipPrompt, ...
```

**Dlaczego**: `GameScreen` przed refaktoringiem F‑07 miał 538 LOC i pomieszane: maszynę stanów, losowanie haseł, orkiestrację TTS, obsługę audio, render 3 faz. Każda regresja wymagała ponownego studiowania całości.

**Po wyniesieniu**: hook zwraca czyste API zorientowane domenowo. `GameScreen` (125 LOC) jest *tylko* widokiem, podkomponenty (`<HandoffPanel>`, `<TurnControls>` itp.) konsumują pojedyncze elementy API. Hook jest testowalny w izolacji (zob. `src/hooks/useTurn.test.ts`).

**Kiedy powielać**: jeśli komponent ma `useState` + 2+ `useEffect` + > 200 LOC logiki — przenieś logikę do dedykowanego hooka.

---

### 2.2. Sanitacja na granicy systemu (`src/lib/sanitize.ts`)

```ts
// App.tsx — jednorazowa sanitacja po hydracji z localStorage
useEffect(() => {
  if (sanitizedRef.current) return;
  sanitizedRef.current = true;
  const cleanSettings = sanitizeSettings(settings, DEFAULT_SETTINGS);
  if (JSON.stringify(cleanSettings) !== JSON.stringify(settings)) {
    setSettings(cleanSettings);
  }
  // analogicznie dla players
}, [...]);
```

**Dlaczego**: dane z `localStorage` mogą być zmodyfikowane przez użytkownika lub złośliwe rozszerzenie. W szczególności kolor gracza jest interpolowany do `style={{ background: \`${color}11\` }}` — co bez walidacji daje CSS injection.

`sanitize.ts` realizuje:
- regex `/^#[0-9a-fA-F]{6}$/` na kolorach (CSS injection guard)
- clamp zakresów liczbowych (winScore, speechRate, bonusByTier)
- whitelist znaków w nazwach (strip C0/C1 controls, zero‑width, bidi override)
- dedup ID/kolorów/emoji
- merge brakujących kluczy `bonusByTier` z defaultami

**Kiedy powielać**: każdy nowy klucz `localStorage` musi przejść przez sanitizer. Każdy nowy field `Player`/`Settings` wymaga rozszerzenia funkcji sanitujących + testu.

---

### 2.3. Generation counter w async callbackach (`useSpeech`)

```ts
const genRef = useRef(0);

const speak = useCallback((text, opts) => {
  synth.cancel();
  const gen = ++genRef.current;
  const u = new SpeechSynthesisUtterance(text);
  const fire = () => {
    if (genRef.current === gen) opts?.onEnd?.();
  };
  u.onend = fire;
  u.onerror = fire;
  synth.speak(u);
}, [...]);

const cancel = useCallback(() => {
  genRef.current++;  // ← unieważnia pending callbacki
  synthRef.current?.cancel();
}, []);
```

**Dlaczego**: SpeechSynthesis API jest asynchroniczne i nie da się odpiąć listenera po `cancel()`. Bez generation counter, anulowane TTS odpalało `onEnd` na nowym hasłą.

**Kiedy powielać**: wszędzie gdzie async callback może odpalić po unieważnieniu kontekstu — fetch z race, debounce, IntersectionObserver, animation frames. Wzorzec: jednorazowo zwiększ licznik przed nowym requestem, sprawdź zgodność w callbacku.

---

### 2.4. Refs synchronizowane ze state dla async dostępu (`useTurn`)

```ts
const [phase, setPhase] = useState<Phase>('handoff');
const phaseRef = useRef<Phase>('handoff');
useEffect(() => { phaseRef.current = phase; }, [phase]);

// W callbacku async (np. po-TTS):
speak(prompt.text, {
  onEnd: () => {
    if (phaseRef.current !== 'ready') return;  // ← świeży stan
    // ...
  }
});
```

**Dlaczego**: zwykły domknięcie nad state'em (`if (phase !== 'ready')`) ma stary state w callbacku async, bo react reuje render → nowy obiekt callbacka, ale stary nadal może odpalić. Ref aktualizuje się synchronicznie po każdym renderze.

**Kiedy powielać**: zawsze gdy `setTimeout` / Promise / event listener czyta wartość, która mogła się zmienić od momentu wpięcia handlera.

---

### 2.5. Debounced persistence z flushem na lifecycle (`usePersistedState`)

```ts
useEffect(() => {
  if (!ready.current) { ready.current = true; return; }
  if (timerRef.current != null) clearTimeout(timerRef.current);
  timerRef.current = window.setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(latestRef.current));
  }, debounceMs);
}, [key, state, debounceMs]);

// + flush na pagehide + visibilitychange
useEffect(() => {
  const flush = () => { /* sync write */ };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  // ...
}, [key]);
```

**Dlaczego**: każdy keystroke w imieniu gracza = `JSON.stringify(players) + setItem`. Bez debouncea = ~5–20 ms blokady main threadu na ruchach suwakami. `pagehide`/`visibilitychange` chroni przed utratą stanu gdy debounce nie zdążył flushnąć.

**Kiedy powielać**: każdy wysokoczęstotliwościowy zapis (input, slider, scroll, drag).

---

### 2.6. Code splitting przez `React.lazy`

```ts
// App.tsx
const GameScreen = lazy(() =>
  import('./components/GameScreen').then((m) => ({ default: m.GameScreen })),
);

<Suspense fallback={<ScreenFallback label="Ładuję grę…" />}>
  <GameScreen ... />
</Suspense>
```

**Dlaczego**: `GameScreen` ciągnie `prompts.ts` (~12 kB gz) + cały hook `useTurn`. `ResultScreen` ciągnie `canvas-confetti` (~5 kB gz). Żadne z tego nie jest potrzebne na ekranie setupu. Lazy load: chunk główny 87 → 70 kB gz (−20%).

**Kiedy powielać**: każdy ekran/modal który nie jest widoczny przy pierwszym renderze + ciężki (>3 kB gz).

---

### 2.7. Memoizacja z custom komparatorem (`CountdownRing`)

```ts
export const CountdownRing = memo(CountdownRingImpl, (a, b) => {
  if (a.announce !== b.announce) return false;
  if (a.duration !== b.duration) return false;
  const aWhole = Math.ceil(a.remaining);
  const bWhole = Math.ceil(b.remaining);
  if (aWhole !== bWhole) return false;
  // Porównaj progress w kubełkach ~5% (20 buckets)
  const aBucket = Math.floor((a.remaining / Math.max(a.duration, 0.0001)) * 20);
  const bBucket = Math.floor((b.remaining / Math.max(b.duration, 0.0001)) * 20);
  return aBucket === bBucket;
});
```

**Dlaczego**: `useTimer` aktualizuje `remaining` ~60 razy/s (rAF). Shallow compare uznałby każdą wartość za inną → re-render 60× na sekundę. Custom komparator zauważa zmianę tylko gdy zmieni się wyświetlana cyfra (zaokrąglona) lub kubełek progresu pierścienia.

**Kiedy powielać**: prop ze stanu wysokoczęstotliwościowego, gdzie efekt wizualny ma niższą rozdzielczość niż dane.

---

### 2.8. `as const` tuple + `noUncheckedIndexedAccess` zamiast guardów

```ts
export const PLAYER_COLORS = ['#7c3aed', '#0ea5e9', ...] as const;
// TS dostaje tuple z literal string union, nie string[]

export function nextColor(used: readonly string[]): string {
  const free = PLAYER_COLORS.find((c) => !used.includes(c));
  if (free) return free;
  return PLAYER_COLORS[used.length % PLAYER_COLORS.length] ?? FALLBACK_COLOR;
}
```

**Dlaczego**: `tsconfig.json: noUncheckedIndexedAccess: true` — indeksowanie array zwraca `T | undefined`. Bez `as const` musielibyśmy guard‑ować każde użycie palety. Z `as const` + fallback typ jest pewny.

**Kiedy powielać**: stałe listy/słowniki w `src/lib/` powinny być `as const`. Współpracuje z `readonly` w sygnaturze funkcji.

---

### 2.9. Local-only error tracking (RODO‑friendly)

```ts
// src/lib/errorLog.ts
installGlobalErrorLog();  // window.onerror + unhandledrejection
// + <ErrorBoundary> w main.tsx
// Wszystko ląduje w localStorage 'error-log' (ring buffer 20 wpisów).
// Brak jakiejkolwiek transmisji na serwer.
```

**Dlaczego**: monitoring błędów potrzebny dla utrzymania jakości, ale Sentry/Bugsnag wymagają wysyłki → kolizja z RODO + brak backendu w architekturze. Lokalny log: użytkownik widzi błędy w panelu ustawień, może skopiować do schowka i ręcznie zgłosić przez GitHub issues.

**Kiedy powielać**: jeśli kiedyś będzie potrzebny remote tracking — dodać OPT‑IN switch z domyślnym `false` + jasna informacja przed wysyłką.

---

## 3. Decyzje świadomie odłożone

| Decyzja | Status | Uzasadnienie |
|---|---|---|
| React 19 / Tailwind 4 | odłożone | Major bumps wymagają osobnej iteracji refactor. Dependabot ignoruje major (`.github/dependabot.yml`). |
| Remote error tracking (Sentry) | odłożone | RODO + brak backendu. F‑21 zrobione jako local-only. |
| E2E testy (Playwright) | odłożone | 82 unit/integration testy pokrywają logikę. E2E to roadmap. |
| Edytor własnych haseł | roadmap | Z pierwotnego promptu jako „faza 2". |
| Tryb drużynowy | roadmap | Z pierwotnego promptu. |
| Tryb ciemny | roadmap | Z pierwotnego promptu. |

---

## 4. Skrypty audytujące

Trzy uruchamialne audyty w `scripts/`:

| Skrypt | Co robi | Exit |
|---|---|---|
| `npm run audit:prompts` | liczy hasła per tier/category, wykrywa duplikaty tekstowe | 1 = duplikaty |
| `npm run audit:licenses` | listuje licencje deps, flaguje GPL/AGPL/SSPL | 1 = ryzykowna licencja |
| `npm run audit:outdated` | grupuje przeterminowane na minor (dependabot) i major (manual) | 0 = informacyjny |
| `npm run audit:all` | wszystkie 3 sekwencyjnie | sumaryczny |

---

## 5. Bramki CI

`.github/workflows/deploy.yml` — uruchamiane na każdy push do `main`:

1. **Lint** — `npm run lint` (tsc strict, 0 błędów)
2. **Tests** — `npm test` (82 testy, ~3.5 s)
3. **Security audit** — `npm audit --omit=dev --audit-level=high`
4. **Build** — `npm run build` z `BASE_PATH=/<repo>/`
5. **Deploy** — GitHub Pages artifact upload

Akcje przypięte do SHA, Dependabot tygodniowo bumpuje.

---

## 6. Konwencje

- **Nazewnictwo plików**: kebab dla skryptów (`audit-prompts.cjs`), PascalCase dla komponentów (`PromptCard.tsx`), camelCase dla hooków (`useTurn.ts`).
- **Komentarze**: wyjaśniaj „dlaczego", nie „co". Kod opisuje „co" — komentarz musi dodawać kontekst niewidoczny w kodzie.
- **Komentarze po polsku**: dla spójności z UI. Identyfikatory po angielsku.
- **Testy**: `*.test.ts` obok kodu testowanego. Plik kodu i plik testów żyją razem.
- **Imports**: typy z `type` (`import type { … }`), runtime osobno.
- **`as const`** dla list/słowników stałych, `readonly` w sygnaturach.

---

## 7. Pliki do edycji przy najczęstszych zmianach

| Zmiana | Pliki |
|---|---|
| Nowe hasło | `src/data/prompts.ts` |
| Nowa kategoria | `src/lib/categories.ts` (+ wpisy w `prompts.ts`) |
| Zmiana mapowania wiek→tier | `src/lib/tier.ts` |
| Nowy klucz w `Settings` | `src/types.ts` + `src/lib/sanitize.ts` + `App.tsx` (default) + UI w `setup/SettingsSection.tsx` + test w `sanitize.test.ts` |
| Nowa faza gry | `src/types.ts` (`Phase`) + `src/hooks/useTurn.ts` + JSX w `GameScreen.tsx` |
| Nowy element UI w setupie | `src/components/setup/XxxSection.tsx` + import w `PlayerSetup.tsx` |
| Nowy klucz localStorage | `src/lib/sanitize.ts` + `PlayerSetup.tsx::APP_STORAGE_KEYS` |
