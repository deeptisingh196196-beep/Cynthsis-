import React from 'react';

interface AcousticWaveProps {
  level: number; // 0 to 1
  isActive: boolean;
  barCount?: number;
  color?: string;
}

export const AcousticWave: React.FC<AcousticWaveProps> = ({
  level,
  isActive,
  barCount = 7,
  color = 'bg-cyan-400',
}) => {
  const bars = Array.from({ length: barCount });

  return (
    <div className="flex items-center justify-center gap-1 h-5 px-1">
      {bars.map((_, i) => {
        // Compute dynamic height based on audio level and bar index
        const centerDistance = Math.abs(i - Math.floor(barCount / 2));
        const variance = Math.sin((i + 1) * 1.3) * 0.3 + 0.7;
        const scale = isActive ? Math.max(0.2, (level * 1.6 + 0.15) * variance * (1 - centerDistance * 0.12)) : 0.15;
        const heightPct = Math.min(100, Math.max(15, scale * 100));

        return (
          <span
            key={i}
            className={`w-[2.5px] rounded-full transition-all duration-75 ${
              isActive ? color : 'bg-zinc-600/40'
            }`}
            style={{
              height: `${heightPct}%`,
              opacity: isActive ? 0.7 + level * 0.3 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
};
