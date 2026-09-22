import React from 'react';

interface AmbientBackgroundProps {
  isListening?: boolean;
  isLoading?: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  isListening = false,
  isLoading = false,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep dark canvas gradient */}
      <div className="absolute inset-0 bg-[#090a0e]" />

      {/* Center ambient glow that reacts subtly to states */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] transition-all duration-1000 ease-out ${
          isListening
            ? 'w-[520px] h-[520px] bg-cyan-500/15 scale-110'
            : isLoading
            ? 'w-[480px] h-[480px] bg-indigo-500/12 animate-pulse'
            : 'w-[420px] h-[420px] bg-blue-600/7'
        }`}
      />

      {/* Subtle micro dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
