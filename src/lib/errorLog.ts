// Lokalny dziennik błędów — ring buffer 20 ostatnich, persystowany w
// localStorage. Bez wysyłki na żaden serwer (RODO). Użytkownik może
// obejrzeć log w panelu prywatności, skopiować jako tekst lub wyczyścić.

const STORAGE_KEY = 'error-log';
const MAX_ENTRIES = 20;

export interface ErrorEntry {
  timestamp: number;
  source: 'window' | 'unhandledrejection' | 'react';
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

function readAll(): ErrorEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ErrorEntry =>
        e &&
        typeof e === 'object' &&
        typeof e.timestamp === 'number' &&
        typeof e.message === 'string',
    );
  } catch {
    return [];
  }
}

function writeAll(entries: ErrorEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // ignore quota
  }
}

function truncate(s: string | undefined, max = 2000): string | undefined {
  if (s == null) return undefined;
  if (s.length <= max) return s;
  return s.slice(0, max) + '… (obcięte)';
}

export function logError(entry: Omit<ErrorEntry, 'timestamp'>): void {
  const all = readAll();
  all.push({
    timestamp: Date.now(),
    ...entry,
    message: truncate(entry.message, 500) ?? '(brak komunikatu)',
    stack: truncate(entry.stack, 3000),
    url: truncate(entry.url, 500),
    userAgent: truncate(entry.userAgent, 300),
  });
  writeAll(all);
}

export function getErrors(): ErrorEntry[] {
  return readAll();
}

export function clearErrors(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const ERROR_LOG_STORAGE_KEY = STORAGE_KEY;

/**
 * Rejestruje globalne nasłuchiwacze błędów. Wywołać raz przy starcie aplikacji
 * (w main.tsx, PRZED render). Idempotentne — kolejne wywołania nic nie robią.
 */
let installed = false;
export function installGlobalErrorLog(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('error', (e: ErrorEvent) => {
    logError({
      source: 'window',
      message: e.message || String(e.error),
      stack: e.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reason: unknown = e.reason;
    let message: string;
    let stack: string | undefined;
    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      try {
        message = JSON.stringify(reason);
      } catch {
        message = String(reason);
      }
    }
    logError({
      source: 'unhandledrejection',
      message,
      stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });
}
