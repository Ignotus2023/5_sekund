import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownRing } from './CountdownRing';

describe('CountdownRing', () => {
  it('wyświetla zaokrągloną pozostałą sekundę', () => {
    render(<CountdownRing remaining={3.4} duration={5} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('wyświetla "sekunda" w liczbie pojedynczej dla 1', () => {
    render(<CountdownRing remaining={0.5} duration={5} />);
    expect(screen.getByText('sekunda')).toBeInTheDocument();
  });

  it('wyświetla "sekund" dla wartości innych niż 1', () => {
    render(<CountdownRing remaining={2.3} duration={5} />);
    expect(screen.getByText('sekund')).toBeInTheDocument();
  });

  it('ma role="timer" z aria-label dotyczącą pozostałego czasu', () => {
    render(<CountdownRing remaining={2.5} duration={5} announce />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', 'Pozostało 3 sekund');
  });

  it('aria-label bez announce informuje o czasie tury', () => {
    render(<CountdownRing remaining={5} duration={5} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', 'Czas tury: 5 sekund');
  });

  it('w ostatnich 3 sekundach z announce dodaje sr-only role=status', () => {
    render(<CountdownRing remaining={1.5} duration={5} announce />);
    // Element z role=status powinien istnieć w trybie announce + ostatnie 3s
    const statuses = screen.getAllByRole('status');
    expect(statuses.length).toBeGreaterThan(0);
  });
});
