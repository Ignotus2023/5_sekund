interface Props {
  remaining: number;
  duration: number;
}

export function CountdownRing({ remaining, duration }: Props) {
  const safeDuration = Math.max(duration, 0.0001);
  const progress = Math.max(0, Math.min(1, remaining / safeDuration));
  const radius = 110;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  const ratio = progress;
  const color = ratio > 0.5 ? '#10b981' : ratio > 0.25 ? '#f59e0b' : '#ef4444';
  const wholeLeft = Math.max(0, Math.ceil(remaining));
  const pulsing = wholeLeft <= 1 && remaining > 0;

  return (
    <div className={`relative w-64 h-64 sm:w-72 sm:h-72 mx-auto ${pulsing ? 'animate-pulse-fast' : ''}`}>
      <svg viewBox="0 0 256 256" className="w-full h-full -rotate-90">
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-7xl sm:text-8xl font-black tabular-nums" style={{ color }}>
          {wholeLeft}
        </div>
        <div className="text-sm text-slate-500 font-bold uppercase tracking-wide mt-1">
          sekund
        </div>
      </div>
    </div>
  );
}
