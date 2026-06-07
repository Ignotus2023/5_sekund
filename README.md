# 5 Sekund — rodzinna gra (PWA)

Rodzinna gra **„5 Sekund"** w wersji webowej (PWA). Gracz dostaje hasło typu **„Wymień 3 owoce"** i ma 5 sekund (z możliwym bonusem czasu dla młodszych), żeby podać trzy rzeczy z danej kategorii. Hasła są dobierane do wieku gracza, czytane na głos po polsku, a aplikacja prowadzi punktację, kolejki i wyłania zwycięzcę.

## Najważniejsze funkcje

- Konfiguracja graczy (imię + wiek 5–16 lub „Dorosły"), automatyczne kolory i awatary.
- 6 poziomów trudności mapowanych z wieku, ok. 50 polskich haseł na poziom (banki w bundle, działają offline).
- Bonus czasowy (handicap) konfigurowany na ekranie startowym dla każdego poziomu wieku osobno; można wyłączyć.
- Odliczanie z dużym pierścieniem SVG, tykaniem co sekundę, sygnałem końca i wibracją telefonu.
- Lektor (Web Speech API) `pl-PL` z regulacją tempa i fallbackiem, jeśli głos jest niedostępny.
- Punktacja, korekta punktów, próg zwycięstwa (5/10/15 pkt lub tryb swobodny), ekran wyniku z konfetti.
- Pamiętanie graczy i ustawień (localStorage).
- PWA — manifest, service worker, instalacja na ekranie głównym, pełne działanie offline po pierwszym wczytaniu.

## Wymagania

- Node.js 18+ (zalecane 20+).

## Uruchomienie

```bash
npm install
npm run dev       # serwer deweloperski (http://localhost:5173)
npm run build     # zbuduj wersję produkcyjną do dist/
npm run preview   # podgląd zbudowanej wersji
```

## Wdrożenie statyczne

`npm run build` produkuje statyczny folder `dist/`. Wystarczy go opublikować pod dowolnym serwerem HTTP (nginx, Caddy, Vercel, Netlify, GitHub Pages itp.).

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

## Ikony PWA

W `public/` znajdują się **placeholderowe** ikony `pwa-192x192.png` i `pwa-512x512.png` generowane przez `scripts/generate-icons.cjs`. Przed publikacją podmień je na właściwe (np. wygenerowane w https://realfavicongenerator.net).

## Bank haseł

Wszystkie hasła znajdują się w `src/data/prompts.ts`, podzielone na 6 poziomów (`5-6`, `7-8`, `9-10`, `11-12`, `13-16`, `dorosli`). Można je swobodnie rozszerzać — wystarczy dopisać kolejne wpisy do odpowiedniej tablicy. Mapowanie wiek → poziom jest scentralizowane w `src/lib/tier.ts` (funkcja `tierOf`).

## Struktura projektu

```
src/
  components/    PlayerSetup, GameScreen, CountdownRing, ScoreBoard, ResultScreen
  data/          Bank haseł podzielony na poziomy
  hooks/         useSpeech, useTimer, useAudio, usePersistedState
  lib/           Mapowanie wiek → tier, utils, kolory
  App.tsx, main.tsx, index.css, types.ts
```

## Skróty klawiszowe (desktop)

- `Enter` na polu imienia — dodaje gracza.

## Licencja

Projekt prywatny / rodzinny.
