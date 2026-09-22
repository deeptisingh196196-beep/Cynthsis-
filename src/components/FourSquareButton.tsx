import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Film, FolderOpen, Camera, ChevronDown } from 'lucide-react';
import { FourSquareTab } from './FourSquareMediaHub';

interface FourSquareButtonProps {
  onOpenHub: (tab?: FourSquareTab) => void;
  variant?: 'searchbar' | 'hero' | 'floating' | 'header';
  attachedCount?: number;
}

export const FourSquareButton: React.FC<FourSquareButtonProps> = ({
  onOpenHub,
  variant = 'searchbar',
  attachedCount = 0,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectTab = (tab: FourSquareTab) => {
    setIsMenuOpen(false);
    onOpenHub(tab);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* The 4-Square Icon Button */}
      <button
        type="button"
        id={variant === 'hero' ? 'hero-four-square-btn' : variant === 'header' ? 'header-four-square-btn' : 'searchbar-four-square-btn'}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className={`group relative flex items-center justify-center transition-all duration-200 cursor-pointer ${
          variant === 'hero'
            ? 'px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] gap-2'
            : variant === 'header'
            ? 'p-1.5 rounded-xl bg-zinc-850/90 hover:bg-zinc-800 border border-zinc-700/70 hover:border-cyan-400/50 shadow-sm gap-1'
            : 'p-1.5 sm:p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/60 shadow-sm gap-1.5'
        }`}
        title="चार स्क्वायर (4 Squares): फोटो, वीडियो, गैलरी, कैमरा"
        aria-label="4 Squares Media Menu"
      >
        {/* 4 Miniature Colored Quadrant Squares */}
        <div className="grid grid-cols-2 gap-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5">
          {/* Square 1: फोटो (Purple) */}
          <span className="w-full h-full bg-purple-500 rounded-[2px] shadow-[0_0_4px_rgba(168,85,247,0.6)] group-hover:scale-105 transition-transform" />
          {/* Square 2: वीडियो (Cyan) */}
          <span className="w-full h-full bg-cyan-400 rounded-[2px] shadow-[0_0_4px_rgba(6,182,212,0.6)] group-hover:scale-105 transition-transform" />
          {/* Square 3: गैलरी (Emerald) */}
          <span className="w-full h-full bg-emerald-400 rounded-[2px] shadow-[0_0_4px_rgba(16,185,129,0.6)] group-hover:scale-105 transition-transform" />
          {/* Square 4: कैमरा (Rose) */}
          <span className="w-full h-full bg-rose-500 rounded-[2px] shadow-[0_0_4px_rgba(244,63,94,0.6)] group-hover:scale-105 transition-transform" />
        </div>

        {variant === 'hero' && (
          <span className="text-xs font-semibold tracking-wide text-zinc-200 group-hover:text-white flex items-center gap-1">
            <span>4 स्क्वायर</span>
            <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </span>
        )}

        {/* Attached Badge if media is already attached */}
        {attachedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-black flex items-center justify-center shadow-md">
            {attachedCount}
          </span>
        )}
      </button>

      {/* Quick Flyout Menu showing the 4 squares clearly labeled */}
      {isMenuOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-56 sm:w-64 bg-[#11131a] border border-zinc-750 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-2.5 py-1.5 mb-1 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-mono">
              चार स्क्वायर फीचर्स
            </span>
            <span className="text-[10px] text-cyan-400">तुरंत चुनें</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* SQUARE 1: फोटो (Photo) */}
            <button
              type="button"
              id="popover-btn-photo"
              onClick={() => handleSelectTab('photo')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-400 text-center transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-purple-300">
                फोटो
              </span>
              <span className="text-[9px] text-purple-400/80">बनाएं & भेजें</span>
            </button>

            {/* SQUARE 2: वीडियो (Video) */}
            <button
              type="button"
              id="popover-btn-video"
              onClick={() => handleSelectTab('video')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 text-center transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                वीडियो
              </span>
              <span className="text-[9px] text-cyan-400/80">बनाएं & भेजें</span>
            </button>

            {/* SQUARE 3: गैलरी (Gallery) */}
            <button
              type="button"
              id="popover-btn-gallery"
              onClick={() => handleSelectTab('gallery')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-400 text-center transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                गैलरी
              </span>
              <span className="text-[9px] text-emerald-400/80">फ़ोन से चुनें & टिक</span>
            </button>

            {/* SQUARE 4: कैमरा (Camera) */}
            <button
              type="button"
              id="popover-btn-camera"
              onClick={() => handleSelectTab('camera')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 hover:border-rose-400 text-center transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-rose-300">
                कैमरा
              </span>
              <span className="text-[9px] text-rose-400/80">Live Snap</span>
            </button>
          </div>

          <div className="mt-2 pt-1.5 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={() => handleSelectTab('menu')}
              className="text-[10px] text-zinc-400 hover:text-cyan-400 transition-colors w-full font-medium"
            >
              पूरा 4-स्क्वायर मीडिया हब खोलें →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
