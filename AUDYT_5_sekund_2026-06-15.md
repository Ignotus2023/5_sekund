# AUDYT 5_sekund — 2026‑06‑15

Profesjonalny audyt aplikacji webowej **„5 Sekund"** (`gra-5-sekund@1.0.0`) — rodzinna gra w wersji PWA. Audyt łączący perspektywę bezpieczeństwa aplikacyjnego (AppSec), jakości kodu i architektury, RODO oraz operacji.

**Audytor**: Claude (Opus 4.7) jako senior audytor jakości i bezpieczeństwa
**Data**: 2026‑06‑15
**Branch**: `claude/blissful-faraday-4ZKkQ`, HEAD `356b7a4`
**Zakres**: cały kod + konfiguracja + CI/CD + zależności
**Tryb**: tylko‑do‑odczytu (zero modyfikacji w trakcie audytu)
**Wykorzystane narzędzia**: `tsc --noEmit`, `vite build`, `npm audit`, `npm outdated`, `npm ls`, ręczne skany regex/grep, ręczna analiza kodu źródłowego

---

## 1. Podsumowanie wykonawcze

Aplikacja jest **technicznie zdrowa**: TypeScript w trybie strict, czysty type‑check i build, brak `eval`/`innerHTML`/`dangerouslySetInnerHTML`, sensowna struktura modułów, solidna sanitacja danych z localStorage, dobre wzorce React (hooki, refy, memo). Jako prosta gra do użytku rodzinnego — działa.

**Trzy istotne ryzyka wymagają decyzji**:

1. **🔴 KRYTYCZNY — RODO**. Aplikacja w obecnej formie zbiera i utrwala dane dzieci (imię + wiek 5–16) na publicznie dostępnym serwisie (GitHub Pages) — bez polityki prywatności, bez podstawy prawnej, bez prawa do usunięcia. Jeśli ma pozostać udostępniona poza prywatnym kręgiem, wymaga albo (a) polityki prywatności + mechanizmu „eksport/usuń", albo (b) zamknięcia do prywatnej dystrybucji (lokalny LAN, login, parametr URL).

2. **🟠 WYSOKI — łańcuch dostaw**. `npm audit` raportuje **3 podatności (1 high, 2 moderate)** w łańcuchu `esbuild ≤ 0.28 ← vite ≤ 6.4.1 ← vite-plugin-pwa@0.20.5`. Wpływ ogranicza się do środowiska deweloperskiego (dev‑server), ale wymaga aktualizacji `vite-plugin-pwa` do v1.x.

3. **🟠 WYSOKI — auto‑deploy z brancha deweloperskiego**. Workflow GitHub Pages publikuje produkcję z `claude/blissful-faraday-4ZKkQ` bez review/PR — każdy push idzie na żywo.

**Brak testów** automatycznych (zero plików `*.test.*`/`*.spec.*`) i monolityczne komponenty (GameScreen 538 LOC, PlayerSetup 450 LOC) podnoszą koszt utrzymania, ale nie blokują działania. Rekomendowane do średnioterminowego planu.

**Werdykt ogólny**: bezpieczeństwo techniczne ~7/10, bezpieczeństwo prawne (RODO) ~3/10, jakość kodu ~7/10, jakość operacji ~5/10. Po naprawie 3 kluczowych ryzyk projekt jest gotów do dalszego rozwoju.

---

## 2. Karta wyników

| Wymiar | Ocena | Krótkie uzasadnienie |
|---|---|---|
| 1. Bezpieczeństwo aplikacji | 🟡 **7/10** | Zero XSS/eval/innerHTML; solidna sanitacja danych z localStorage; brak CSP; ekspozycja przez auto‑deploy z brancha dev |
| 2. Łańcuch dostaw / zależności | 🟠 **5/10** | 3 CVE w deps (1 high), 9 paczek major out‑of‑date, akcje GH przypięte do tagów nie SHA |
| 3. Jakość kodu | 🟡 **7/10** | TS strict, czysty `tsc`, czytelny styl; ale 2 god‑komponenty i 1 god‑plik danych |
| 4. Architektura | 🟢 **8/10** | Czyste warstwowanie components/hooks/lib/data; sensowne abstrakcje (useTimer, useSpeech, useAudio); persistencja przez jeden hook |
| 5. Wydajność | 🟢 **8/10** | rAF + memoizacja CountdownRing/ScoreBoard, debounce localStorage; brak code‑splittingu (akceptowalny dla 86 kB gz) |
| 6. Testy | 🔴 **0/10** | Zero testów. Krytyczny brak dla logiki kontroli stanu (Phase machine) i sanitacji |
| 7. Dokumentacja / DevEx | 🟡 **6/10** | Solidny README; brak LICENSE, brak CHANGELOG; README niespójny z aktualnym stanem (kategorie/liczby) |
| 8. Operacje / CI/CD | 🟠 **5/10** | Pipeline minimalny, brak testów, akcje na tagach, deploy z brancha dev, brak alertów / monitoringu |
| 9. Ochrona danych (RODO) | 🔴 **3/10** | Dane dzieci, brak polityki, brak retencji, brak prawa do usunięcia (jest manualnie via DevTools) |
| 10. Dostępność (WCAG) | 🟢 **8/10** | Pełne pokrycie aria-live/role/labels; focus management; reduced-motion; widoczne wskaźniki aktywności |

---

## 3. Faza 0 — Mapa projektu (skrót)

| | |
|---|---|
| Typ | SPA + PWA, frontend‑only, statyczna |
| Stack | TypeScript 5.9 (strict) + React 18.3 + Vite 5.4 + Tailwind 3.4 + vite‑plugin‑pwa 0.20 |
| Repo | Branch `claude/blissful-faraday-4ZKkQ`, **brak `main`** [POTWIERDZONE] `git branch -a` |
| LOC | 3 124 LOC w 21 plikach `.ts/.tsx/.css`; 783 hasła gry w `prompts.ts` |
| Bundle | JS 276 kB raw / **86 kB gz**, CSS 33 kB raw / 5 kB gz; precache PWA 311 KiB |
| Hosting | GitHub Pages (`ignotus2023.github.io/5_sekund/`) |
| External calls | wyłącznie Google Fonts CDN (`Nunito`) [POTWIERDZONE] `index.html:11-13` |
| Backend / API | **brak** |
| Telemetria | **brak** |
| Sekrety | **brak w repozytorium** [POTWIERDZONE] grep całego repo + `git log` |

**Architektura logiczna**:

```
main.tsx → <StrictMode> → App
  ├── PlayerSetup     (handoff: ekran konfiguracji)
  ├── GameScreen      (Phase machine: handoff→ready→running→judged|paused)
  └── ResultScreen    (zwycięstwo + ranking)

hooks/
  ├── useTimer        (rAF + durationRef, stabilne useCallback-i)
  ├── useSpeech       (Web Speech API pl-PL, gen counter)
  ├── useAudio        (Web Audio API, proceduralne dźwięki)
  └── usePersistedState (localStorage + debounce 200 ms + flush)

lib/
  ├── tier            (mapowanie wiek→Tier)
  ├── categories      (16 kategorii)
  ├── sanitize        (walidacja całego stanu z localStorage)
  └── utils           (Math.random uid, palety, pickRandom)

data/prompts.ts       (783 hasła, 6 poziomów × 16 kategorii)
```

---

## 4. Szczegółowe ustalenia

Ustalenia uporządkowane od najważniejszych. Każde zawiera: lokalizację, status dowodu, wpływ, rekomendację, szacowany nakład (**S** ≤ 0.5 dnia / **M** 0.5–2 dni / **L** > 2 dni).

### 🔴 KRYTYCZNE

---

#### F‑01 🔴 RODO: zbieranie danych dzieci bez podstawy prawnej i polityki prywatności

**Status**: [POTWIERDZONE]
**Lokalizacja**:
- `src/types.ts:8-15` — interface `Player { name, age, … }`
- `src/App.tsx:23` — `usePersistedState<Player[]>('players', [])`
- `src/lib/sanitize.ts:22-26` — `sanitizeAge` przyjmuje 5–16 (eksplicytnie dzieci)
- `src/components/PlayerSetup.tsx:159-164` — opcja wieku 5–16 w UI
- `index.html` — brak linku do polityki prywatności

**Opis**: Aplikacja gromadzi dane osobowe: **imiona dzieci w wieku 5–16 lat** oraz wiek, przechowując je w `localStorage` przeglądarki użytkownika końcowego. Jest publikowana pod publicznym URL `https://ignotus2023.github.io/5_sekund/`.

W kontekście RODO (motyw 38, art. 8) **przetwarzanie danych dzieci ≤ 16 lat wymaga zgody opiekuna prawnego** (w Polsce próg 16 lat zgodnie z art. 8 ust. 1 RODO + ustawa o ochronie danych osobowych z 2018 r.). Aplikacja nie:
- nie informuje o przetwarzaniu (art. 13 RODO);
- nie ma podstawy prawnej (art. 6 + art. 8);
- nie zapewnia prawa do usunięcia (art. 17) — usunięcie tylko ręcznie przez DevTools / przycisk „Usuń gracza";
- nie określa retencji (art. 5 ust. 1 lit. e) — `players` żyje w localStorage bezterminowo;
- nie identyfikuje administratora danych (art. 13 ust. 1 lit. a).

**Łagodzące czynniki**: Dane nie opuszczają urządzenia użytkownika (brak transferu na backend); są przechowywane lokalnie. W ścisłej interpretacji można argumentować, że to **przetwarzanie wyłącznie do celów osobistych lub domowych** (motyw 18 RODO, art. 2 ust. 2 lit. c) — co wyłącza RODO. ALE: hosting pod publicznym URL pozwala dowolnej rodzinie wpisać dane, więc twórca staje się dostarczycielem usługi, a użytkownik osobą fizyczną w gospodarstwie domowym. Granica jest niejednoznaczna. **Wymaga oceny prawnej.**

**Wpływ**: Teoretyczna kara do 4% obrotu / 20 mln EUR — w praktyce dla aplikacji rodzinnej zerowa. Reputacyjnie / etycznie — istotne, bo aplikacja jest „dla dzieci".

**Rekomendacja**:
1. **Najprostsza ścieżka (najtańsza)**: dodać **politykę prywatności** w `index.html` + link na ekranie startu informujący, że dane zostają **na urządzeniu**, nie są przesyłane, można je usunąć przyciskiem (już istnieje „Usuń gracza" w PlayerSetup) lub przez „Wyczyść dane" (nowy przycisk → `localStorage.clear()` + przeładowanie). Określić retencję („do momentu wyczyszczenia") i administratora.
2. **Alternatywnie**: usunąć pole „wiek" jako konkretną liczbę — wystarczy zgrubny tier (5–6 / 7–8 / 9–10 / 11–12 / 13–16 / dorośli) — nadal wystarcza do mechaniki, ale obniża wrażliwość danych. Imiona pozostają, ale ich wrażliwość bez wieku jest niska.
3. **Najczystsza**: nie persystować imion w localStorage — tworzyć drużynę co partię od nowa. Tracimy wygodę, zyskujemy prywatność.

**Nakład**: **S** (polityka + przycisk wyczyszczenia) — **M** (refaktor wieku na tier).

---

### 🟠 WYSOKIE

---

#### F‑02 🟠 Łańcuch dostaw — 3 CVE w deps (1 high, 2 moderate)

**Status**: [POTWIERDZONE] `npm audit` output:

```
esbuild  <=0.28.0    Severity: high
  GHSA-67mh-4wv8-2f99 — dev server otwarty na żądania any‑origin
  GHSA-gv7w-rqvm-qjhr — RCE przez NPM_CONFIG_REGISTRY (Deno)
vite  <=6.4.1
  Depends on vulnerable versions of esbuild
vite-plugin-pwa  0.3.0 - 0.3.5 || 0.7.0 - 0.21.0
  Depends on vulnerable versions of vite

3 vulnerabilities (2 moderate, 1 high)
```

**Wpływ**:
- GHSA-67mh-4wv8-2f99 (esbuild ≤ 0.24.x): dev‑server odpowiada na cross‑origin requesty; może być nadużyty z otwartej strony internetowej do odczytu kodu źródłowego z dev‑servera dewelopera. **Wyłącznie ryzyko dla maszyn deweloperskich**, nie dotyczy builda produkcyjnego.
- GHSA-gv7w-rqvm-qjhr: dotyczy Deno + esbuild — nie używamy Deno → **nie dotyczy**.

W praktyce, dla tej aplikacji wpływ jest niski: pipeline CI uruchamia `npm ci` + `npm run build` (build‑time only, dev server nigdy nie startuje na CI). Zagrożenie istnieje wyłącznie podczas lokalnego dewelopmentu.

**Rekomendacja**: Aktualizacja `vite-plugin-pwa` do v1.3.0 ([POTWIERDZONE] `npm outdated`) — niesie ze sobą breaking change ale ciągnie nową wersję vite z patchowanym esbuild.

**Nakład**: **S** (aktualizacja + szybki test buildu).

---

#### F‑03 🟠 CI auto‑deploy z brancha developerskiego

**Status**: [POTWIERDZONE]
**Lokalizacja**: `.github/workflows/deploy.yml:7-8`

```yaml
on:
  push:
    branches:
      - main
      - claude/blissful-faraday-4ZKkQ
```

**Opis**: Workflow uruchamia publikację na GitHub Pages **przy każdym pushu** zarówno na `main`, jak i na branch developerski `claude/blissful-faraday-4ZKkQ`. Branch `main` **nie istnieje** w repo ([POTWIERDZONE] `git branch -a`), więc cały deploy faktycznie żyje z gałęzi dev.

**Wpływ**:
- Każdy commit (włącznie z work‑in‑progress, sprzed code‑review, sprzed testów) idzie natychmiast na produkcję.
- Brak rozdziału środowiska dev/prod.
- Brak punktu „bezpiecznego wycofania" — repo nie ma stabilnego brancha do rollbacku.
- Stan obecny był praktycznie konieczny do tego, żeby aplikacja w ogóle pierwszy raz wstała na GitHub Pages (brak `main`), ale po pierwszym deployu ten trigger powinien zniknąć.

**Rekomendacja**:
1. Utworzyć branch `main` z aktualnym stanem `claude/blissful-faraday-4ZKkQ` (`git checkout -b main && git push -u origin main`).
2. W `.github/workflows/deploy.yml` zostawić tylko `branches: [main]`.
3. Dla dewelopki — PR‑y z `claude/...` do `main`. Każdy merge = świadomy deploy.
4. Włączyć `Settings → Branches → main → Require PR before merging` (opcjonalnie).

**Nakład**: **S**.

---

#### F‑04 🟠 Brak testów automatycznych

**Status**: [POTWIERDZONE] zero plików `*.test.*` lub `*.spec.*` w repo (`find src -name '*.test.*' -o -name '*.spec.*'` → 0 wyników)

**Opis**: Aplikacja nie ma żadnych testów (unit, integration, e2e). Krytyczne obszary nieprzetestowane:
- **Maszyna stanów `Phase`** w `GameScreen.tsx:44` (handoff → ready → running → judged → paused) — historia commitów pokazuje wielokrotne regresje (`Fix "Zaczynamy" tap regression`, `Fix countdown not starting after handoff`, `Keep Zaliczone/Pudło in fixed columns`);
- **Sanitacja** (`src/lib/sanitize.ts`) — kluczowa dla bezpieczeństwa i RODO, zera asercji;
- **Logika losowania bez powtórek** (`drawPrompt` w `GameScreen.tsx:123-150`) — była wielokrotnie naprawiana;
- **Hook `useTimer`** (`src/hooks/useTimer.ts`) — rAF + pauza/wznowienie, finezyjne stany;
- **`usePersistedState`** — debounce + flush na pagehide, łatwo o regresję.

**Wpływ**: Każdy nowy commit ryzykuje cichą regresję. Audyt manualny w czacie nie zastąpi pakietu testów.

**Rekomendacja**:
1. Dodać Vitest (już w ekosystemie Vite) + `@testing-library/react`.
2. Pierwsze 5 testów: (a) `sanitizePlayers/sanitizeSettings` — walidacja brudnych danych z localStorage; (b) `tierOf` — granice wieku; (c) `drawPrompt` — brak powtórek, fallback przy pustej puli; (d) `useTimer` — start/pause/resume/stop; (e) maszyna `Phase` w `GameScreen` na poziomie integracyjnym.
3. Dodać do CI: `npm run test` przed `npm run build`.

**Nakład**: **M** (~2 dni dla MVP testów + CI).

---

### 🟡 ŚREDNIE

---

#### F‑05 🟡 Brak Content Security Policy (nawet via `<meta>`)

**Status**: [POTWIERDZONE] grep `Content-Security-Policy` w `index.html` i `src/**/*.tsx` → 0 wyników
**Lokalizacja**: `index.html` (brak meta tagu)

**Opis**: GitHub Pages nie pozwala ustawić CSP w nagłówkach HTTP, ale można to zrobić deklaratywnie przez `<meta http-equiv="Content-Security-Policy">`. Obecnie brak jakiegokolwiek CSP — przeglądarka stosuje wartość domyślną (najbardziej permisywną).

**Wpływ**: Bez CSP brak warstwy obronnej, gdyby kiedykolwiek zacommitowany został `dangerouslySetInnerHTML` z user inputem albo gdyby załadowano niezaufaną zewnętrzną bibliotekę. Obecnie kod nie ma XSS, więc brak CSP to ryzyko **prewencyjne**, nie aktywne.

**Rekomendacja**: Dodać do `<head>` w `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self';
  manifest-src 'self';
  worker-src 'self';
  base-uri 'self';
  form-action 'none';
">
```

`'unsafe-inline'` dla stylów konieczne, bo Tailwind + interpolowane `style={{}}` generują inline‑style. Service worker wymaga `worker-src 'self'`.

**Wymaga testu**: SW + canvas‑confetti z `'self'` może wymagać debugowania. Zacząć w trybie `Content-Security-Policy-Report-Only`.

**Nakład**: **S** (~2h z testem).

---

#### F‑06 🟡 Akcje GitHub przypięte do tagów (nie SHA) — supply‑chain

**Status**: [POTWIERDZONE]
**Lokalizacja**: `.github/workflows/deploy.yml:23, 25, 39, 41, 54`

```yaml
uses: actions/checkout@v4
uses: actions/setup-node@v4
uses: actions/configure-pages@v5
uses: actions/upload-pages-artifact@v3
uses: actions/deploy-pages@v4
```

**Opis**: Akcje przypięte do mutowalnych tagów `@v4`/`@v5`. Jeśli atakujący przejmie konto/repo `actions/*` (mało prawdopodobne, ale przykład — kradzież SBOM marca 2024), wpłynie to natychmiast na każde uruchomienie naszego pipeline. Najlepsza praktyka: przypiąć do SHA z komentarzem wersji.

**Wpływ**: Niskie ryzyko dla `actions/*` (zaufana organizacja), ale GitHub w Security Hardening Guide rekomenduje SHA‑pinning dla deployów produkcyjnych.

**Rekomendacja**:

```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
- uses: actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8  # v4.0.2
# itd.
```

Można zautomatyzować z [pin-github-action](https://github.com/mheap/pin-github-action) lub `dependabot.yml` (auto‑aktualizacje przypiętych SHA).

**Nakład**: **S**.

---

#### F‑07 🟡 god‑komponenty: GameScreen (538 LOC), PlayerSetup (450 LOC)

**Status**: [POTWIERDZONE] `wc -l src/components/*.tsx`
**Lokalizacja**:
- `src/components/GameScreen.tsx` — 538 LOC, jeden komponent zawiera: maszynę stanów, losowanie, orkiestrację TTS, audio, render 3 fazowych UI (handoff/play/judged), korektę punktów.
- `src/components/PlayerSetup.tsx` — 450 LOC, ekran konfiguracji z 5 sekcjami (gracze, ustawienia, handicap, kategorie, historia).

**Opis**: `GameScreen` ma 7 useRef‑ów, 3 useState‑y, 5 useCallback‑ów, 3 useEffect‑y, 538 LOC JSX i logiki w jednym pliku. Trudne do testowania (mock TTS + Audio + Timer + 3 useEffect‑ów), trudne do code‑review (każdy refactor ryzykuje regresję maszyny stanów — historia commitów to potwierdza).

**Wpływ**: Wysokie koszty utrzymania, częste regresje przy zmianach. Architektura jest dobra (warstwy hooks/components rozdzielone), ale `GameScreen` nie wykorzystuje tej możliwości.

**Rekomendacja**: Wydobyć logikę maszyny stanów do hooka `useTurn(players, settings, onScore)` zwracającego `{ phase, currentPrompt, acceptTurn, judge, pause, resume, skip, … }`. Render rozbić na `<HandoffPanel>` / `<PlayCard>` / `<JudgedHeader>` / `<TurnControls>` / `<ScoreAdjust>`. Każdy podkomponent ≤ 80 LOC, testowalny niezależnie.

W `PlayerSetup` — wyciągnąć każdą sekcję do podkomponentu (`<SettingsSection>`, `<HandicapSection>`, `<HistorySection>`). Pojawi się ~5 plików po ~80 LOC.

**Nakład**: **M** (~1 dzień refactor + ~0.5 dnia weryfikacji).

---

#### F‑08 🟡 prompts.ts 838 LOC w głównym bundlu (brak code‑splittingu)

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/data/prompts.ts` (838 LOC, ~40 kB raw)

**Opis**: Bank 783 haseł ląduje w głównym chunku Vite — od pierwszego renderu (ekran setup). Zużycie pamięci tworzy strukturę `Record<Tier, Prompt[]>` w czasie ładowania modułu.

`CategorySelector.tsx:11` wywołuje `useMemo(() => countByCategoryAndTier(), [])` przy każdym otwarciu accordionu kategorii — wymaga obecności pełnej tabeli.

**Wpływ**:
- Bundle: prompts.ts to ~10–12 kB gz spośród 86 kB gz całości (~13%). Akceptowalne.
- Time‑to‑interactive: minimalne opóźnienie na pierwszym ekranie (gracz konfiguruje partię — nie potrzebuje haseł). Lazy import na `GameScreen` przyspieszyłby Lighthouse, ale realny zysk dla użytkownika końcowego jest marginalny (PWA i tak prekeszuje całość).

**Rekomendacja**: Niska priorytetowo. Jeśli zostaną dodane kolejne setki haseł, rozważyć:
1. Wynieść tabelę liczników (`COUNTS_BY_CATEGORY_TIER`) jako prekompilowany JSON na potrzeby `CategorySelector`.
2. `const GameScreen = lazy(() => import('./GameScreen'))` w `App.tsx`. Suspense fallback minimalny.

**Nakład**: **M** (~0.5 dnia + testy).

---

#### F‑09 🟡 `CategorySelector` — niespójna logika „Tylko codzienne" / pusta selekcja

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/components/CategorySelector.tsx:24-28`

```ts
const selectAll = () => onChange([]);
const selectNone = () => onChange(['codzienne']); // minimalne, żeby gra była grywalna
```

**Opis**: Konwencja w kodzie: `[]` (pusta lista) = „wszystkie kategorie" (potwierdzone w `GameScreen.tsx:127`). Ale `selectNone()` ustawia `['codzienne']` zamiast `[]` — co prowadzi do mylącej semantyki: użytkownik klika „Tylko codzienne", widzi pojedynczą zaznaczoną kategorię — OK. Ale jeśli user ręcznie odznaczy ostatnią kategorię, wraca do stanu „wszystkie", co jest **przeciwieństwem** intencji.

Dodatkowo komentarz `// minimalne, żeby gra była grywalna` jest mylący — `GameScreen.tsx:131` ma już fallback: jeśli pula danego tieru jest pusta po filtracji, używa pełnej puli. Więc gra **i tak jest grywalna** z pustą selekcją.

**Wpływ**: Mylące UX, niespójność semantyki. Niski impakt funkcjonalny.

**Rekomendacja**:
1. Wyraźna konwencja: `[]` = brak filtracji (= wszystkie). `[X, Y]` = tylko X i Y.
2. Przycisk „Tylko codzienne" → `onChange(['codzienne'])` z labelem „Tylko jedna kategoria" lub usunięcie tego przycisku (mała wartość).
3. Toggle ostatniej kategorii — opcja A: nie pozwalać odznaczyć ostatniej (UI zachowuje minimum 1); opcja B: po odznaczeniu wszystkich pokazać banner „Brak selekcji = wszystkie kategorie".

**Nakład**: **S**.

---

#### F‑10 🟡 `Math.random()` dla generowania ID i kluczy persystencji

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/lib/utils.ts:1-3`

```ts
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
```

**Opis**: `uid()` używa `Math.random()` zamiast `crypto.randomUUID()` lub `crypto.getRandomValues()`. `Math.random()` w nowoczesnych przeglądarkach generuje **PRNG nie‑kryptograficzny**, ze stosunkowo małą entropią dla krótkich tokenów. Tu jest używany do tworzenia ID gracza, które mogą się przeplatać między gospodarstwami domowymi (jeżeli ktoś by miał współdzieloną stronę).

**Wpływ**: Niski. ID gracza nie jest sekretem ani referencją bezpieczeństwa. `sanitizePlayers` (`src/lib/sanitize.ts:101-103`) i tak deduplikuje ID, więc kolizja nie powoduje crashu.

**Rekomendacja**:

```ts
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
```

`crypto.randomUUID()` dostępne we wszystkich nowoczesnych przeglądarkach (https://caniuse.com/mdn-api_crypto_randomuuid).

**Nakład**: **S**.

---

#### F‑11 🟡 Brak walidacji `BASE_PATH` przy budowie

**Status**: [POTWIERDZONE]
**Lokalizacja**: `vite.config.ts:7`

```ts
const base = process.env.BASE_PATH || '/';
```

**Opis**: Wartość trafia bezpośrednio do `vite.base`, `manifest.start_url`, `manifest.scope`. Brak normalizacji (`endsWith('/')`, walidacji ścieżki). W obecnym workflow wartość pochodzi z `${{ github.event.repository.name }}` — kontrolowane. Ale gdyby ktoś sforkował repo do organizacji z dziwną nazwą lub zmodyfikował workflow, mogłoby to skutkować np. `BASE_PATH=javascript:alert(1)` w manifeście.

**Wpływ**: Niski (workflow kontrolowany). Ale w razie forka — wektor.

**Rekomendacja**: Dodać walidację:

```ts
function safeBase(input: string | undefined): string {
  if (!input) return '/';
  if (!/^\/[A-Za-z0-9_\-./]*\/$/.test(input)) {
    throw new Error('BASE_PATH musi pasować do /^\\/[A-Za-z0-9_\\-./]*\\/$/, otrzymano: ' + input);
  }
  return input;
}
const base = safeBase(process.env.BASE_PATH);
```

**Nakład**: **S**.

---

#### F‑12 🟡 Brak `noUncheckedIndexedAccess` w tsconfig

**Status**: [POTWIERDZONE]
**Lokalizacja**: `tsconfig.json:5-18`

**Opis**: `strict: true` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch` są włączone — bardzo dobrze. Ale brak `noUncheckedIndexedAccess`. Skutek: `players[activeIndex]` ma typ `Player` (nie `Player | undefined`), choć w runtime to może być `undefined` (poza zakresem).

`GameScreen.tsx:102` częściowo to obsługuje (`const safeIndex = players.length > 0 ? activeIndex % players.length : 0`), ale `activePlayer` na linii 102 wciąż ma typ `Player` zamiast `Player | undefined`, mimo że może być undefined gdy `players.length === 0`. Guard na linii 272 to ratuje.

W innych miejscach (np. `prompts.ts:825` `PROMPTS[tier]`) — `PROMPTS` ma typ `Record<Tier, Prompt[]>`, więc indeksowanie po `Tier` jest bezpieczne.

**Wpływ**: Niskie — bo defensywne guard‑y istnieją. Ale wymusza ręczne myślenie zamiast pomocy kompilatora.

**Rekomendacja**: Włączyć `noUncheckedIndexedAccess: true`. Spowoduje to ~5–10 nowych błędów TypeScript, każdy łatwy do naprawy (`if (x) return x` lub `x ?? fallback`). Po naprawie kod jest bezpieczniejszy.

**Nakład**: **S**.

---

#### F‑13 🟡 Brak ograniczenia długości / sanityzacji nazwy gracza w UI

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/components/SortablePlayerList.tsx:83`, `src/components/PlayerSetup.tsx:144`

```tsx
<input maxLength={24} ... />
```

**Opis**: UI ogranicza długość imienia do 24 znaków (`maxLength={24}`), ale to **tylko po stronie HTML**. Można obejść przez ustawienie `localStorage` ręcznie. Sanitize (`sanitize.ts:32`) faktycznie tnie do 24 znaków przy hydratacji — dobrze. ALE nie tnie znaków specjalnych typu `<script>` z kontekstu CSS/HTML — React i tak escape'uje przy renderingu (wszystkie wyświetlenia idą przez `{p.name}`, nie `dangerouslySetInnerHTML`), więc ryzyko XSS = 0.

Sprawdziłem przez TTS: imię gracza **nie jest** przekazywane do `speak()` ([POTWIERDZONE] grep — tylko `speak(prompt.text)`), więc brak wektora abuse przez TTS. ARIA‑label używa imienia (`SortablePlayerList.tsx:66`), ale screen reader też wypowiada to bezpiecznie.

**Wpływ**: Bardzo niski. Imię może zawierać znaki Unicode (emoji, RTL), które wpływają na layout, ale to znana cecha.

**Rekomendacja**: Akceptowalne jak jest. Ewentualnie: rozważyć whitelistę `/^[\p{L}\p{N}\s\-']{1,24}$/u` w `sanitizeString`, ale ogranicza rodzicom prawo do nadawania pseudo‑nicków.

**Nakład**: brak (akceptacja stanu).

---

#### F‑14 🟡 Workflow nie uruchamia testów ani lintów

**Status**: [POTWIERDZONE]
**Lokalizacja**: `.github/workflows/deploy.yml:36`

```yaml
- name: Build
  env:
    BASE_PATH: /${{ github.event.repository.name }}/
  run: npm run build
```

**Opis**: Pipeline robi tylko `npm ci && npm run build`. `npm run lint` (czyli `tsc --noEmit`) nie jest uruchamiany — choć w obecnym stanie `npm run build` zaczyna od `tsc` (`package.json:8`), więc lint trafia tam pośrednio. Niemniej, nie ma kroku odpowiedzialnego za testy (bo testów brak — patrz F‑04).

**Wpływ**: Brak warstwy „pre‑deploy gate". Każdy commit deploy‑uje, nawet jeśli pojawiłyby się testy w przyszłości.

**Rekomendacja**: Po dodaniu testów (F‑04) — dodać krok:

```yaml
- name: Lint and test
  run: |
    npm run lint
    npm run test -- --run
```

**Nakład**: **S** po dodaniu testów.

---

### 🟢 NISKIE

---

#### F‑15 🟢 `CountdownRing` — `aria-live` zawsze `'off'`

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/components/CountdownRing.tsx:45`

```tsx
aria-live={announce ? 'off' : 'off'}
```

Wyrażenie zawsze zwraca `'off'`. Komentarz w kodzie wyjaśnia, że osobny region poniżej (linia 78–82) przejmuje ogłaszanie ostatnich 3 sekund. Funkcjonalnie OK, ale `announce ? 'off' : 'off'` to martwa logika.

**Rekomendacja**: Zmienić na `aria-live="off"`. Code smell, nie błąd.

**Nakład**: **S** (1 minuta).

---

#### F‑16 🟢 README niespójny z aktualnym stanem

**Status**: [POTWIERDZONE]
**Lokalizacja**: `README.md:8-9`

```
- 6 poziomów trudności mapowanych z wieku, ok. 80 polskich haseł na poziom (łącznie ~480, …).
- 11 kategorii haseł …
```

Aktualny stan: **783 hasła**, **16 kategorii** ([POTWIERDZONE] inwentaryzacja prompts.ts).

**Rekomendacja**: Zaktualizować liczby. Generować podsumowanie automatycznie ze skryptu (`scripts/stats.js`?) i wstawiać do README.

**Nakład**: **S**.

---

#### F‑17 🟢 Mylące nazwy zmiennych w `PlayerSetup` (`nameId` / `ageId`)

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/components/PlayerSetup.tsx:31-32, 188-189, 218-219`

```ts
const nameId = useId();  // ...używane jako legend ID dla "Próg zwycięstwa"
const ageId = useId();   // ...używane jako legend ID dla "Czas bazowy"
```

`nameId` jest wpięty w `<legend id={nameId}>Próg zwycięstwa</legend>` (PlayerSetup.tsx:188), nie ma nic wspólnego z „nazwą". Podobnie `ageId`.

**Wpływ**: Czytelność. Logika działa.

**Rekomendacja**: Zmienić na `winScoreId` / `baseSecondsId`. Dodać `speechRateId` (już istnieje), `bonusByTierId`. Czytelniej.

**Nakład**: **S**.

---

#### F‑18 🟢 `useEffect` w `EmojiPicker` — brak focus return przy braku pickniętej opcji

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/components/EmojiPicker.tsx:35-40`

```ts
const onDocClick = (e: MouseEvent) => {
  // ... close popover
  setOpen(false);   // ← nie wraca focus na trigger
};
```

`onDocClick` zamyka popover bez ustawienia focus z powrotem na trigger. Tylko `handlePick` (linia 80) i `Escape` (linia 45) to robią. Outside‑click jest poprawny logicznie, ale focus zostaje na… ostatnim elemencie (potencjalnie body).

**Wpływ**: A11y nit. Klawiatura traci pozycję.

**Rekomendacja**: Po `setOpen(false)` w `onDocClick` — `requestAnimationFrame(() => triggerRef.current?.focus())`. Albo świadomie: pozwolić użytkownikowi „kliknąć obok" = świadome opuszczenie focusu, bez przywracania.

**Nakład**: **S**.

---

#### F‑19 🟢 `SortablePlayerList` — `onChange`/`onRemove` rekreowane przy każdym renderze

**Status**: [POTWIERDZONE]
**Lokalizacja**: `src/components/SortablePlayerList.tsx:166-172`

```tsx
<SortablePlayerRow
  onChange={(patch) => setPlayers(players.map(...))}
  onRemove={() => setPlayers(players.filter(...))}
  ...
/>
```

Inline closure → nowa funkcja przy każdym renderze rodzica → `SortablePlayerRow` nie jest memoizowany, ale nawet gdyby był, propsy się zmieniają, więc memo nie pomoże.

**Wpływ**: Performance — minimalny dla 2–10 graczy. Nie jest hot path.

**Rekomendacja**: Niska priorytetowo. Refaktor na `useCallback` z deps `[players, setPlayers]` zmieni zachowanie w `useCallback` (rekreacja przy każdej zmianie listy). Bez zysku.

**Nakład**: brak.

---

#### F‑20 🟢 Brak licencji projektu (LICENSE file)

**Status**: [POTWIERDZONE] `ls -la` → brak LICENSE
**Lokalizacja**: root

**Opis**: README mówi „Projekt prywatny / rodzinny" (linia 97), ale brak pliku LICENSE oznacza domyślne **„All rights reserved"** — co utrudnia dystrybucję, akceptację PR‑ów od osób trzecich, integrację z innymi narzędziami.

**Rekomendacja**: Dodać LICENSE (np. MIT albo „UNLICENSED"). Dla projektu rodzinnego: MIT z notką „dla użytku osobistego".

**Nakład**: **S**.

---

#### F‑21 🟢 Brak monitoringu błędów / telemetrii

**Status**: [POTWIERDZONE] grep `Sentry|Bugsnag|Rollbar|GA|gtag|analytics` → 0

**Opis**: Brak Sentry / Bugsnag / RoUM. Wszystkie błędy frontu giną w przeglądarce użytkownika.

**Wpływ**: Niski (aplikacja stateless, mała). Akceptowalne dla projektu rodzinnego. Dla produkcji szerszej — wymaga.

**Rekomendacja**: Decyzja świadoma. Jeśli planujesz wystawiać szerzej, dodać minimalne `window.addEventListener('error', …)` + `unhandledrejection` → POST do prostego endpointa logu (np. Plausible / fly.io / Netlify Forms).

**Nakład**: brak (świadoma akceptacja) lub **M** (jeśli dodajesz tracking).

---

### ⚪ INFORMACYJNE

---

#### F‑22 ⚪ Inwentaryzacja banku haseł

Statystyki ([POTWIERDZONE] inwentaryzacja `src/data/prompts.ts`):

| Poziom | Hasła |
|---|---|
| 5–6 | 142 |
| 7–8 | 131 |
| 9–10 | 122 |
| 11–12 | 119 |
| 13–16 | 124 |
| dorośli | 145 |
| **Suma** | **783** |

| Kategoria | Liczność |
|---|---|
| polska | 160 |
| codzienne | 104 |
| geografia | 55 |
| nauka | 55 |
| jedzenie | 53 |
| zwierzeta | 53 |
| bajki | 50 |
| kultura | 49 |
| filmy | 37 |
| muzyka | 36 |
| historia | 34 |
| sport | 30 |
| swieta | 25 |
| przyroda | 19 |
| szkola | 14 |
| ludzie | 9 |

Dystrybucja jest **mocno przesunięta w stronę kategorii „polska"** (20% wszystkich haseł). Bajki/filmy/muzyka są niedoreprezentowane na niższych poziomach. To wybór redakcyjny, nie błąd.

---

#### F‑23 ⚪ Inwentaryzacja zależności + licencje

[POTWIERDZONE] `npm ls --depth=0`:

| Pakiet | Licencja | Komentarz |
|---|---|---|
| react / react-dom 18.3.1 | MIT | OK |
| @dnd-kit/{core, sortable, utilities} | MIT | OK |
| canvas-confetti 1.9.4 | ISC | OK |
| @vitejs/plugin-react 4.7.0 | MIT | OK |
| tailwindcss 3.4.19 | MIT | OK |
| typescript 5.9.3 | Apache‑2.0 | OK |
| vite 5.4.21 | MIT | OK |
| vite-plugin-pwa 0.20.5 | MIT | OK |
| postcss 8.5.15 | MIT | OK |
| autoprefixer 10.5.0 | MIT | OK |

Brak licencji ryzykownych (GPL, AGPL, SSPL). Dla projektu prywatnego — bez znaczenia. Dla komercjalizacji — OK.

---

#### F‑24 ⚪ Pakiety przeterminowane (major)

[POTWIERDZONE] `npm outdated`:

| Paczka | Current | Latest | Uwaga |
|---|---|---|---|
| react | 18.3.1 | 19.2.7 | major; wymaga rewizji w razie migracji |
| react-dom | 18.3.1 | 19.2.7 | jw. |
| @types/react{,-dom} | 18.3.x | 19.x | musi iść z React 19 |
| vite | 5.4.21 | 8.0.16 | 3 major; usuwa CVE z F‑02 |
| vite-plugin-pwa | 0.20.5 | 1.3.0 | usuwa CVE z F‑02 |
| typescript | 5.9.3 | 6.0.3 | major; minimalne ryzyko |
| tailwindcss | 3.4.19 | 4.3.1 | major; istotne zmiany w CSS engine |
| @vitejs/plugin-react | 4.7.0 | 6.0.2 | major |

**Rekomendacja**: Aktualizować w fali, nie wszystko naraz. Najpilniejsze: `vite-plugin-pwa` 0.20 → 1.x (zamyka F‑02). Pozostałe to świadome decyzje migracyjne.

---

#### F‑25 ⚪ Wzorce architektoniczne — co działa dobrze

Świadome dobre praktyki, które stanowią mocne strony projektu:

- **Czyste warstwowanie** — `components/` / `hooks/` / `lib/` / `data/`, każda warstwa ma jasną odpowiedzialność ([POTWIERDZONE] mapa Faza 0).
- **`sanitize.ts`** — kompletna walidacja całego stanu z localStorage (kolory regex, zakresy liczbowe, deduplikacja emoji/koloru, kompletność `bonusByTier` przez `TIERS.every`). To wzorcowy hardening boundary‑input.
- **`useSpeech.genRef`** — generacyjny counter unieważnia stare callbacki TTS po cancel ([POTWIERDZONE] `useSpeech.ts:52-58`). Pomysł niełatwy, bardzo dobrze zaimplementowany.
- **`useTimer.durationRef`** — czas trwania w refie, nie state — komentarz wprost wyjaśnia wyścig ([POTWIERDZONE] `useTimer.ts:9-12`). Dobry komentarz „dlaczego", nie „co".
- **`React.memo` z custom porównywaniem** — `CountdownRing.tsx:90-100` porównuje zaokrągloną sekundę + kubełek ~5% progresu zamiast każdego rAF tick. Świadome.
- **Sanitacja jednorazowa** — `App.tsx:30-46` z `sanitizedRef` chroni przed infinite loop sanitacja → setState → sanitacja.
- **Debounce + flush w `usePersistedState`** — `pagehide` + `visibilitychange` (`usePersistedState.ts:44-65`) — odporne na zamknięcie karty.
- **Maszyna stanów `Phase`** — eksplicytna, nie magia: `'handoff' | 'ready' | 'running' | 'judged' | 'paused'`. Każda tranzycja widoczna w kodzie.
- **A11y** — pełne pokrycie `aria-live`, `role="status"`, `role="timer"`, `role="dialog"` z focus trap, `aria-current`, `aria-pressed`, `aria-haspopup`, ciemniejsze warianty kolorów tekstu (kontrast). Solidne.

---

## 5. Plan naprawczy z priorytetami

### Szybkie zwycięstwa (1–3 dni łącznie)

W kolejności ROI (zwrot z inwestycji):

| Pri | Ustalenie | Nakład | Wartość |
|---|---|---|---|
| 1 | **F‑01** Dodać politykę prywatności + przycisk „Wyczyść wszystkie dane" | S | RODO compliance — kluczowe |
| 2 | **F‑02** `npm install vite-plugin-pwa@1` → ponowny test → commit | S | Zamyka 3 CVE |
| 3 | **F‑03** Utworzyć branch `main`, usunąć `claude/...` z triggera deploy | S | Higiena CI, możliwość code-review |
| 4 | **F‑05** Dodać `<meta http-equiv="Content-Security-Policy">` w trybie report-only | S | Warstwa obronna prewencyjna |
| 5 | **F‑10** `crypto.randomUUID()` w `uid()` | S | Higiena entropii |
| 6 | **F‑11** Walidacja `BASE_PATH` w `vite.config.ts` | S | Defense in depth |
| 7 | **F‑12** Włączyć `noUncheckedIndexedAccess` w tsconfig | S | Bezpieczeństwo typów |
| 8 | **F‑15** Naprawić `aria-live={announce ? 'off' : 'off'}` | S | Code smell |
| 9 | **F‑16** Zaktualizować README (liczba kategorii / haseł) | S | Dokumentacja |
| 10 | **F‑17** Zmienić mylące nazwy `nameId`/`ageId` → `winScoreId`/`baseSecondsId` | S | Czytelność |
| 11 | **F‑20** Dodać LICENSE | S | Higiena prawna |

Łącznie: ~1.5–2.5 dnia.

### Działania strategiczne (1–2 tygodnie)

| Pri | Ustalenie | Nakład | Wartość |
|---|---|---|---|
| A | **F‑04** Dodać Vitest + pierwsze 5–10 testów (sanitize, tier, useTimer, drawPrompt, Phase machine) + krok w CI | M (~2 dni) | Zapobiega regresjom; podstawa do bezpiecznej refaktoryzacji |
| B | **F‑07** Refaktor `GameScreen` → hook `useTurn` + 4 podkomponenty | M (~1.5 dnia) | Testowalność, mniejsze ryzyko regresji |
| C | **F‑06** SHA‑pinning akcji GitHub + dependabot dla automatyki | S+M (~0.5 dnia) | Supply‑chain hardening |
| D | **F‑09** Klaryfikacja `CategorySelector` (semantyka pustej selekcji + przycisk minimum) | S | Lepszy UX |
| E | **F‑13** (opcjonalnie) whitelist znaków w `sanitizeString` | S | Wąsko niski impakt |

Łącznie: ~4–5 dni.

### Świadomie odłożone / decyzja produktowa

- **F‑08** code‑splitting `prompts.ts` — niski ROI dopóki bank nie wzrośnie 2–3× (>1500 haseł).
- **F‑14** kroki testów w CI — zależne od F‑04.
- **F‑19** memoizacja w `SortablePlayerList` — nie hot path.
- **F‑21** monitoring błędów — wymaga decyzji o szerszej dystrybucji.

### Sugerowana sekwencja w czasie

```
Tydzień 1 (poniedziałek)
  • F‑02 update vite-plugin-pwa             (rano, S)
  • F‑01 polityka prywatności + reset       (popołudnie, S)
  • F‑03 main branch + workflow trigger     (wieczór, S)

Tydzień 1 (wtorek)
  • F‑12 noUncheckedIndexedAccess + fix     (rano, S)
  • F‑10 crypto.randomUUID                  (rano, S)
  • F‑11 walidacja BASE_PATH                (rano, S)
  • F‑05 CSP w meta + test                  (popołudnie, S)
  • F‑15-17 + F‑20 cleanup                  (wieczór, S)

Tydzień 1 (środa-czwartek)
  • F‑04 Vitest setup + testy podstawowe    (M, 2 dni)

Tydzień 2 (poniedziałek-wtorek)
  • F‑07 dekompozycja GameScreen            (M, 1.5 dnia)
  • F‑09 CategorySelector cleanup           (S, 0.5 dnia)

Tydzień 2 (środa)
  • F‑06 SHA-pinning + dependabot           (S+M, 0.5 dnia)
  • F‑14 CI testy + lint krok               (S, 0.5 dnia)
```

---

## 6. Założenia i ograniczenia audytu

1. **Brak żywego ruchu**. Aplikacja nie była uruchamiana w przeglądarce w czasie audytu — analiza statyczna kodu + build + audit. Brak weryfikacji Web Speech API w realnych przeglądarkach (Chrome / Safari / Firefox).
2. **Brak penetration testu**. Nie próbowano ataków na żywą instancję (XSS przez specjalnie spreparowane localStorage, fuzzing dataset).
3. **Brak analizy prawnej**. Ustalenie F‑01 (RODO) jest **opinią technika**, nie radcy prawnego. Zaleca się walidację z prawnikiem przy szerszej dystrybucji.
4. **Brak deep‑diveu w `@dnd-kit`**. Sprawdziłem tylko interfejs publiczny i licencję. W przypadku CVE w samej bibliotece — `npm audit` jest jedynym używanym narzędziem.
5. **Brak audytu service workera w runtime**. Workbox skonfigurowany przez `vite-plugin-pwa` — sprawdziłem konfigurację, ale nie wygenerowany `sw.js` w detalach.
6. **Brak audytu PWA install flow na realnych urządzeniach** (iOS Safari, Android Chrome). Manifest poprawny w teorii.
7. **Audyty wcześniejsze potraktowane jako historia** (zgodnie z instrukcją), ale niektóre ustalenia mogą być powtórzeniem (np. wcześniejszy audyt też wskazywał na F‑03 i F‑07).
8. **Brak weryfikacji RODO praktyki rynkowej**. Analogiczne aplikacje (np. WhatsApp, gry mobilne) mają polityki prywatności — opieram się o standardową praktykę EU, nie o szczegółową doktrynę PUODO.
9. **Branch `main` nie istnieje**. Cały audyt opiera się na stanie brancha dev. Po utworzeniu `main` warto powtórzyć ten audyt jako baseline.
10. **Bundle analiza powierzchowna**. Brak `rollup-plugin-visualizer` lub równoważnego — szacunki rozmiarów per‑zależność są oczne.

---

## 7. Wniosek

Aplikacja **„5 Sekund"** jest dobrze zbudowanym, niewielkim PWA z **solidnym fundamentem technicznym** i dobrze przemyślanym design systemem. W obecnym stanie nadaje się do prywatnego użytku rodzinnego.

Aby pójść dalej (publikacja, większa dystrybucja), wymaga zaadresowania:

1. **RODO** (F‑01) — minimum: polityka prywatności + mechanizm wyczyszczenia danych.
2. **Łańcuch dostaw** (F‑02) — aktualizacja `vite-plugin-pwa` zamyka 3 CVE.
3. **Wyodrębnienie produkcji od dewelopki** (F‑03) — utworzenie brancha `main`, deploy z PR.
4. **Pierwsze testy** (F‑04) — Vitest + 5–10 testów obszaru wysokiego ryzyka.

Wszystkie pozostałe ustalenia to dług techniczny średniego i niskiego priorytetu, do zaadresowania w komfortowym tempie.

**Stan ogólny: dobry. Trajektoria: pozytywna (poprzednie audyty miały bardziej krytyczne ustalenia, większość została naprawiona).**

---

*Raport wygenerowany w trybie tylko‑do‑odczytu. Brak modyfikacji w kodzie w czasie audytu. Wszystkie ustalenia zweryfikowane na bazie HEAD `356b7a4` (`claude/blissful-faraday-4ZKkQ`).*
