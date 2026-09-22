import React, { useState, useRef } from 'react';
import { Mic, Search, ArrowRight, X, Loader2, Eye, Plus } from 'lucide-react';
import { AcousticWave } from './AcousticWave';
import { MicState, AttachedMedia } from '../types';
import { FourSquareButton } from './FourSquareButton';
import { FourSquareTab } from './FourSquareMediaHub';

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
  onSubmit: (text?: string) => void;
  isLoading: boolean;
  micState: MicState;
  audioLevel: number;
  onToggleMic: () => void;
  speechLang?: 'hi' | 'en';
  onToggleLang?: () => void;
  onOpenFourSquares?: (initialTab?: FourSquareTab) => void;
  attachedMedia?: AttachedMedia[];
  onRemoveAttachedMedia?: (id: string) => void;
  onClearAllAttachedMedia?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChange,
  onSubmit,
  isLoading,
  micState,
  audioLevel,
  onToggleMic,
  speechLang = 'hi',
  onToggleLang,
  onOpenFourSquares,
  attachedMedia = [],
  onRemoveAttachedMedia,
  onClearAllAttachedMedia,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isListening = micState === 'listening';
  const isMicRequesting = micState === 'requesting';
  const hasAttachments = attachedMedia.length > 0;
  const canSubmit = (query.trim().length > 0 || hasAttachments) && !isLoading;

  // Handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    } else if (e.key === 'Escape') {
      onChange('');
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 relative z-10" id="cynthsis-search-container">
      {/* Attached Media Strip (Above the input, when photos/camera snaps are attached) */}
      {hasAttachments && (
        <div className="mb-2 p-2 rounded-2xl bg-[#11131a]/95 border border-cyan-500/30 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-zinc-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{attachedMedia.length} मीडिया संलग्न (AI इसे देखेगा)</span>
            </div>
            {onClearAllAttachedMedia && (
              <button
                type="button"
                onClick={onClearAllAttachedMedia}
                className="text-zinc-400 hover:text-white transition-colors text-[10px]"
              >
                सभी हटाएं
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 overflow-x-auto">
            {attachedMedia.map((item) => (
              <div
                key={item.id}
                className="relative group/attached flex-shrink-0 flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-1.5 pr-2 shadow-sm"
              >
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover border border-zinc-700"
                />
                <div className="flex flex-col text-left max-w-[110px]">
                  <span className="text-[10px] font-semibold text-white truncate">
                    {item.type === 'camera'
                      ? '📷 कैमरा'
                      : item.type === 'gallery'
                      ? '🖼️ गैलरी'
                      : item.type === 'video'
                      ? '🎬 वीडियो'
                      : '📸 फोटो'}
                  </span>
                  <span className="text-[9px] text-zinc-400 truncate">
                    {item.name}
                  </span>
                </div>
                {onRemoveAttachedMedia && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachedMedia(item.id)}
                    className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
                    title="हटाएं"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Add more button */}
            {onOpenFourSquares && (
              <button
                type="button"
                onClick={() => onOpenFourSquares('menu')}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-dashed border-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors shrink-0 cursor-pointer"
                title="और फोटो/मीडिया जोड़ें"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>और जोड़ें</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Outer Glow container on focus or listening */}
      <div
        className={`relative transition-all duration-300 rounded-2xl p-[1px] ${
          isListening
            ? 'bg-gradient-to-r from-cyan-500/60 via-blue-500/60 to-teal-400/60 shadow-[0_0_35px_rgba(6,182,212,0.22)]'
            : isFocused || hasAttachments
            ? 'bg-gradient-to-r from-cyan-500/40 via-zinc-600 to-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.12)]'
            : 'bg-zinc-800/80 hover:bg-zinc-750'
        }`}
      >
        <div className="flex items-center gap-2 bg-[#12141a]/95 backdrop-blur-xl px-4 py-3 sm:py-3.5 rounded-2xl">
          {/* Search / Status Icon */}
          <div className="flex items-center justify-center text-zinc-400 pl-1">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            ) : isListening ? (
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 relative" />
              </div>
            ) : (
              <Search className="w-5 h-5 text-zinc-500 transition-colors group-hover:text-zinc-400" />
            )}
          </div>

          {/* 4-Square Media Hub Button (Replaces old + button) */}
          {onOpenFourSquares && (
            <FourSquareButton
              onOpenHub={onOpenFourSquares}
              variant="searchbar"
              attachedCount={attachedMedia.length}
            />
          )}

          {/* Interactive Input with "Ask Cynthsis" */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              id="cynthsis-interactive-input"
              type="text"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : hasAttachments
                  ? 'इस मीडिया के बारे में पूछें (Ask about attached media)...'
                  : 'Ask Cynthsis...'
              }
              autoComplete="off"
              spellCheck="false"
              className="w-full bg-transparent text-white placeholder-zinc-500 text-base sm:text-lg focus:outline-none py-1 pr-2 tracking-wide font-normal"
            />

            {/* Acoustic Waveform if microphone is active */}
            {isListening && (
              <div className="hidden sm:flex items-center mr-2">
                <AcousticWave level={audioLevel} isActive={true} color="bg-cyan-400" />
              </div>
            )}
          </div>

          {/* Controls: Clear, Language Switch, Microphone, Submit */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Clear Input Button */}
            {query.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                id="cynthsis-clear-btn"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
                title="Clear input"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Language Switcher (Hindi / English) */}
            {onToggleLang && (
              <button
                type="button"
                id="cynthsis-lang-toggle"
                onClick={onToggleLang}
                title={`Current voice language: ${speechLang === 'hi' ? 'Hindi (हिंदी / Hinglish)' : 'English'}. Click to switch.`}
                className="px-2 py-1 text-xs font-mono rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition-all flex items-center gap-1 select-none"
              >
                <span className={speechLang === 'hi' ? 'text-cyan-400 font-semibold' : 'text-zinc-400'}>
                  {speechLang === 'hi' ? '🇮🇳 हिंदी' : '🌐 EN'}
                </span>
              </button>
            )}

            {/* Interactive Microphone Access Button */}
            <button
              type="button"
              id="cynthsis-mic-btn"
              onClick={onToggleMic}
              disabled={isLoading}
              title={
                isListening
                  ? 'Microphone active (click to stop)'
                  : isMicRequesting
                  ? 'Requesting microphone permission...'
                  : 'Access microphone to speak'
              }
              aria-label="Toggle microphone access"
              className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                isListening
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.45)] scale-105'
                  : isMicRequesting
                  ? 'bg-cyan-950 text-cyan-300 animate-pulse'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              {isListening ? (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              ) : isMicRequesting ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-cyan-400" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Submit / Ask Cynthsis Button */}
            <button
              type="button"
              id="cynthsis-ask-btn"
              onClick={() => onSubmit()}
              disabled={!canSubmit}
              title="Ask Cynthsis"
              aria-label="Ask Cynthsis"
              className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                canSubmit
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-100 cursor-pointer font-bold'
                  : 'text-zinc-600 bg-zinc-850 cursor-not-allowed opacity-50'
              }`}
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
