# 5 Sekund — rodzinna gra (PWA)

Rodzinna gra **„5 Sekund"** w wersji webowej (PWA). Gracz dostaje hasło typu **„Wymień 3 owoce"** i ma 5 sekund (z możliwym bonusem czasu dla młodszych), żeby podać trzy rzeczy z danej kategorii. Hasła są dobierane do wieku gracza, czytane na głos po polsku, a aplikacja prowadzi punktację, kolejki i wyłania zwycięzcę.

## Najważniejsze funkcje

- Konfiguracja graczy: imię + wiek (5–16 lub „Dorosły"), wybór ikonki spośród 30 emoji, kolejność tur ustalana przez przeciąganie (drag‑and‑drop z obsługą myszki / dotyku / klawiatury).
- **783 polskie hasła** w 6 poziomach trudności (5–6, 7–8, 9–10, 11–12, 13–16, dorośli) — średnio ~130 haseł na poziom. Bank w bundle, działa offline.
- **16 kategorii** z możliwością wyboru: 🍎 Jedzenie, 🐾 Zwierzęta, 🏠 Codzienne, 🎭 Kultura, 🎵 Muzyka, 🎬 Filmy, 👥 Ludzie, 🌳 Przyroda, 📚 Szkoła, ⚽ Sport, 🗺️ Geografia, 🔬 Nauka, 🏛️ Historia, 🇵🇱 Polska, 🧚 Bajki, 🎄 Święta.
- Historia wylosowanych haseł persystowana między partiami — hasło nie wraca w kolejnej rundzie, dopóki cała pula się nie wyczerpie. Licznik i przycisk czyszczenia w panelu startu.
- Bonus czasowy (handicap) konfigurowany na ekranie startowym osobno dla każdego poziomu wieku.
- Odliczanie z dużym pierścieniem SVG, tykaniem co sekundę, sygnałem końca i wibracją telefonu.
- Lektor (Web Speech API) `pl-PL` z regulacją tempa, automatycznym czytaniem nowego hasła i auto‑startem odliczania po przeczytaniu. Fallback do tekstu, gdy głos jest niedostępny.
- Panel przekazania tury („Teraz kolej: Julia") z przyciskiem „Zaciętamy!" — telefon można podać między graczami bez ryzyka uruchomienia timera na złym gracza.
- Punktacja, korekta punktów, próg zwycięstwa (5/10/15 pkt lub tryb swobodny), ekran wyniku z konfetti.
- **RODO**: polityka prywatności w aplikacji (pełen modal), przycisk „Wyczyść wszystkie dane" usuwający trzy konkretne klucze localStorage.
- **A11y**: pełne pokrycie `aria-live` / `role="status"` / `role="timer"` / `aria-current`, focus management, focus trap w pickerach, `prefers-reduced-motion`.
- PWA — manifest, service worker (workbox), instalacja na ekranie głównym, pełne działanie offline po pierwszym wczytaniu.
- Pamięć graczy, ustawień i historii haseł między sesjami (localStorage z debounce'em + flush na `pagehide` / `visibilitychange`).

## Wymagania

- Node.js 20+ (Vite 8 wymaga `node >= 20.19`).

## Uruchomienie

```bash
npm install
npm run dev          # serwer deweloperski (http://localhost:5173)
npm run lint         # tsc --noEmit (sprawdza typy)
npm test             # Vitest run (74 testy / ~3.5 s)
npm run test:watch   # Vitest w trybie watch
npm run test:coverage # raport pokrycia (html w coverage/)
npm run build        # build produkcyjny do dist/
npm run preview      # podgląd buildu produkcyjnego
```

### Testy

74 testy w 8 plikach pokrywają kluczowe obszary:
- `src/lib/sanitize.test.ts` — sanitacja stanu z localStorage (RODO + CSS injection guard)
- `src/lib/tier.test.ts` — mapowanie wiek→poziom (granice)
- `src/lib/utils.test.ts` — uid, palety, pickRandom
- `src/lib/categories.test.ts` — kompletność i unikalność kategorii
- `src/hooks/useTimer.test.ts` — start/pause/resume/stop + onTick/onEnd z fake timers
- `src/hooks/usePersistedState.test.ts` — hydracja, debounce, flush na pagehide
- `src/hooks/useTurn.test.ts` — maszyna stanów rozgrywki + double-tap guard + persystencja
- `src/components/CountdownRing.test.tsx` — a11y + render zaokrąglonej sekundy

Pokrycie: **src/lib 98%**, **src/hooks 67%** (kluczowa logika), src/components 8% (komponenty UI testowane integracyjnie przez useTurn).

## Wdrożenie online — GitHub Pages

Repo zawiera workflow `.github/workflows/deploy.yml`, który po pushu na branch **`main`** automatycznie:
1. wykonuje `npm run lint` (type-check),
2. uruchamia `npm audit --omit=dev --audit-level=high` (security gate),
3. builduje aplikację z `BASE_PATH=/<nazwa-repo>/`,
4. publikuje folder `dist/` na GitHub Pages.

Aby uruchomić deploy:

1. W ustawieniach repo: **Settings → Pages → Source → GitHub Actions**.
2. Zmerguj zmiany do brancha `main`.
3. Po kilku minutach gra dostępna pod `https://<twoja-nazwa>.github.io/<nazwa-repo>/`.

Akcje GitHub przypięte do SHA (z komentarzem wersji); auto‑aktualizacje przez Dependabot (`.github/dependabot.yml`).

## Wdrożenie statyczne (własny serwer, Vercel, Netlify…)

`npm run build` produkuje statyczny folder `dist/`. Wystarczy go opublikować pod dowolnym serwerem HTTP.

Jeśli serwujesz z podkatalogu (np. `https://example.com/gry/5sekund/`):

```bash
BASE_PATH=/gry/5sekund/ npm run build
```

`BASE_PATH` walidowane przy starcie buildu — musi pasować do `^/(?:[A-Za-z0-9_\-.]+/)*$`.

Przykładowy blok nginx:

```nginx
server {
  listen 443 ssl http2;
  server_name 5sekund.example.com;

  root /var/www/5-sekund/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

> **Uwaga:** pełne PWA (instalacja na ekranie głównym, service worker) działa tylko po HTTPS lub na `localhost`. Na zwykłym HTTP w sieci LAN service worker jest wyłączony, ale sama aplikacja nadal działa w przeglądarce.

## Bezpieczeństwo

- **Content Security Policy** w `<meta>` (strict): `default-src 'self'`, brak `'unsafe-eval'`, brak inline scriptów, `frame-ancestors 'none'`, `object-src 'none'`. Pełna konfiguracja w `index.html`. W dev tryb HMR wymaga luźniejszych ustawień — vite‑plugin `stripCspInDev` usuwa CSP w `vite dev`, zostawia w produkcji.
- Dodatkowe nagłówki: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Sanitacja całego stanu z localStorage (`src/lib/sanitize.ts`) — regex na kolory, whitelista znaków w nazwach (strip C0/C1 controls, zero‑width, bidi override).
- `noUncheckedIndexedAccess` w TS — kompilator wymusza guard‑y przy indeksowaniu tablic.
- 0 znanych CVE (`npm audit --omit=dev`).

## Ikony PWA

W `public/` są **placeholderowe** ikony `pwa-192x192.png` i `pwa-512x512.png` generowane przez `scripts/generate-icons.cjs`. Przed publikacją podmień na właściwe.

## Bank haseł

Wszystkie hasła w `src/data/prompts.ts`, podzielone na 6 poziomów. Każde hasło ma typowaną kategorię (`src/lib/categories.ts`). Format wpisu: `['Wymień 3 …', 'kategoria']`. Mapowanie wiek → poziom: `src/lib/tier.ts` (`tierOf`).

Selekcja kategorii w UI: kafelki z licznikiem haseł per kategoria. `[]` = brak filtra = wszystkie kategorie. Konwencja: nie da się odznaczyć ostatniej kategorii kliknięciem w chip — wraca się do „wszystkich" świadomym kliknięciem przycisku.

## Struktura projektu

```
src/
  App.tsx                       (root, ekrany: setup / play / result)
  main.tsx                      (entry, React.StrictMode)
  types.ts                      (Player, Prompt, GameSettings, Phase…)
  index.css                     (Tailwind + komponenty + reduced-motion)
  components/
    PlayerSetup.tsx             (ekran konfiguracji)
    GameScreen.tsx              (ekran rozgrywki — orkiestrator)
    ResultScreen.tsx            (ranking + konfetti)
    CountdownRing.tsx           (SVG pierścień + announce)
    ScoreBoard.tsx              (lista punktów)
    EmojiPicker.tsx             (popover z focus trap)
    SortablePlayerList.tsx      (DnD-Kit lista graczy)
    CategorySelector.tsx        (siatka kategorii)
    PrivacyPolicy.tsx           (modal RODO)
    setup/                      (sekcje ekranu startu)
      PlayersSection.tsx
      SettingsSection.tsx
      HandicapSection.tsx
      CategoriesSection.tsx
      HistorySection.tsx
      PreviewSection.tsx
      PrivacySection.tsx
    game/                       (podkomponenty rozgrywki)
      HandoffPanel.tsx
      PlayerBanner.tsx
      PromptCard.tsx
      TurnControls.tsx
      ScoreAdjustPanel.tsx
  hooks/
    useTurn.ts                  (maszyna stanów + orkiestracja gry)
    useTimer.ts                 (rAF + durationRef)
    useSpeech.ts                (Web Speech API, gen counter)
    useAudio.ts                 (Web Audio API procedural)
    usePersistedState.ts        (localStorage + debounce + flush)
  lib/
    tier.ts                     (mapowanie wiek→Tier)
    categories.ts               (16 kategorii)
    sanitize.ts                 (walidacja stanu z localStorage)
    utils.ts                    (uid, palety, pickRandom)
  data/
    prompts.ts                  (783 hasła w 6 tierach × 16 kategoriach)
```

## Audyt

Pełny audyt aplikacji (bezpieczeństwo, łańcuch dostaw, jakość kodu, architektura, wydajność, testy, DevOps, RODO, dostępność) w pliku `AUDYT_5_sekund_2026-06-15.md`.

## Skróty klawiszowe

- `Enter` na polu „Imię nowego gracza" — dodaje gracza.
- `Tab` / `Shift+Tab` w popoverze emoji — porusza wybór (focus trap).
- `Escape` zamyka modal polityki prywatności i picker emoji.
- Strzałki góra/dół na uchwycie ⠿ — zmiana kolejności graczy z klawiatury.

## Licencja

MIT — patrz `LICENSE`.
