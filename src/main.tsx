import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorLog } from './lib/errorLog';
import './index.css';

// Listenery globalne ZANIM cokolwiek się wyrenderuje — żeby błąd inicjalizacyjny
// też trafił do dziennika lokalnego.
installGlobalErrorLog();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
