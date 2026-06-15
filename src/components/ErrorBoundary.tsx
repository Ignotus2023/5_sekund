import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../lib/errorLog';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * React Error Boundary — łapie wyjątki w drzewie potomków podczas renderu /
 * lifecycle i pokazuje awaryjny ekran z instrukcją „przeładuj / wyczyść dane".
 * Każdy złapany błąd ląduje też w lokalnym errorLog (RODO: bez zewnętrznej
 * wysyłki).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError({
      source: 'react',
      message: error.message,
      stack: `${error.stack ?? '(brak stosu)'}\n--- componentStack ---\n${info.componentStack ?? ''}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        role="alert"
      >
        <div className="card max-w-md text-center space-y-4">
          <div className="text-5xl" aria-hidden>
            🛠️
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Coś poszło nie tak
          </h1>
          <p className="text-sm text-slate-700">
            Aplikacja napotkała nieoczekiwany błąd. Spróbuj przeładować stronę —
            Twoje dane (gracze, ustawienia, historia) zostają zapisane lokalnie.
          </p>
          <details className="text-left text-xs bg-slate-100 rounded-lg p-3">
            <summary className="cursor-pointer font-bold text-slate-800">
              Szczegóły techniczne
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-all text-slate-700">
              {this.state.error.message}
            </pre>
          </details>
          <button onClick={this.handleReload} className="btn-primary w-full">
            🔄 Przeładuj aplikację
          </button>
          <p className="text-xs text-slate-600">
            Błąd został zapisany w lokalnym dzienniku (Ustawienia → Twoje dane
            → Dziennik błędów). Nie jest wysyłany na żaden serwer.
          </p>
        </div>
      </main>
    );
  }
}
