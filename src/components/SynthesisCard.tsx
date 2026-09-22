import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Volume2, VolumeX, Copy, Check, X, Sparkles, ExternalLink, BookOpen, KeyRound } from 'lucide-react';
import { SynthesisResult } from '../types';
import { AcousticWave } from './AcousticWave';

interface SynthesisCardProps {
  result: SynthesisResult;
  onDismiss?: () => void;
  isSpeaking: boolean;
  onToggleSpeech: (text: string) => void;
  className?: string;
}

export const SynthesisCard: React.FC<SynthesisCardProps> = ({
  result,
  onDismiss,
  isSpeaking,
  onToggleSpeech,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.synthesis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <div
      id="cynthsis-result-card"
      className={`w-full animate-in fade-in slide-in-from-bottom-3 duration-300 relative z-10 ${className}`}
    >
      <div className="bg-[#13151c]/90 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/40">
        {/* Header with Query & Actions */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-mono tracking-wider uppercase text-zinc-300 truncate">
                Cynthsis AI
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/40">
                Direct Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Read-Aloud Voice Button */}
            <button
              type="button"
              id="cynthsis-speak-btn"
              onClick={() => onToggleSpeech(result.synthesis)}
              title={isSpeaking ? 'Stop speaking' : 'Read synthesis aloud'}
              aria-label={isSpeaking ? 'Stop speaking' : 'Read synthesis aloud'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSpeaking
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Listen</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              type="button"
              id="cynthsis-copy-btn"
              onClick={handleCopy}
              title="Copy to clipboard"
              aria-label="Copy to clipboard"
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Dismiss button if onDismiss is provided */}
            {onDismiss && (
              <button
                type="button"
                id="cynthsis-dismiss-btn"
                onClick={onDismiss}
                title="Dismiss synthesis"
                aria-label="Dismiss synthesis"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Voice Reading Bar */}
        {isSpeaking && (
          <div className="py-2.5 flex items-center justify-between gap-3 border-b border-zinc-850/60 text-xs text-cyan-400">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              Speaking synthesis...
            </span>
            <AcousticWave level={0.7} isActive={true} barCount={9} color="bg-cyan-400" />
          </div>
        )}

        {/* Content Body */}
        <div className="pt-4 text-zinc-200 text-sm sm:text-base leading-relaxed overflow-hidden">
          <div className="cynthsis-markdown prose prose-invert max-w-none prose-p:my-2 prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:my-2 prose-ul:my-2 prose-li:my-1 prose-strong:text-zinc-100 prose-code:text-cyan-300 prose-code:bg-zinc-850 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
            <ReactMarkdown>{result.synthesis}</ReactMarkdown>
          </div>
        </div>

        {/* Wikipedia API Grounding Section */}
        {result.wikipedia && (
          <div
            id="cynthsis-wikipedia-grounding"
            className="mt-5 pt-4 border-t border-zinc-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              {result.wikipedia.thumbnail ? (
                <img
                  src={result.wikipedia.thumbnail}
                  alt={result.wikipedia.title}
                  className="w-9 h-9 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                  <BookOpen className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200 truncate">
                    {result.wikipedia.title}
                  </span>
                  {result.wikipedia.authenticatedWithKey ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      <KeyRound className="w-2.5 h-2.5" />
                      Key Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400">
                      Wikipedia API
                    </span>
                  )}
                </div>
                {result.wikipedia.description && (
                  <p className="text-zinc-400 text-[11px] truncate max-w-sm">
                    {result.wikipedia.description}
                  </p>
                )}
              </div>
            </div>

            <a
              href={result.wikipedia.url}
              target="_blank"
              rel="noopener noreferrer"
              id="cynthsis-wiki-link"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-850/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750/50 transition-colors flex-shrink-0 text-[11px] font-medium"
            >
              <span>View on Wikipedia</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

