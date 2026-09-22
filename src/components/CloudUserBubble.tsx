import React from 'react';
import { Cloud, Eye } from 'lucide-react';
import { AttachedMedia } from '../types';

interface CloudUserBubbleProps {
  text: string;
  attachments?: AttachedMedia[];
  timestamp?: number;
}

export const CloudUserBubble: React.FC<CloudUserBubbleProps> = ({ text, attachments }) => {
  return (
    <div
      className="flex flex-col items-end w-full animate-in fade-in slide-in-from-bottom-2 duration-300 my-2"
      id="cynthsis-user-cloud"
    >
      <div className="relative group max-w-[85%] sm:max-w-[75%]">
        {/* Ambient cloud glow */}
        <div className="absolute -inset-1 bg-cyan-500/10 rounded-[26px] blur-md pointer-events-none" />

        {/* Small decorative cloud puffs above the bubble */}
        <div className="absolute -top-1.5 right-8 w-4 h-3 bg-cyan-500/20 rounded-full blur-[0.5px] pointer-events-none" />
        <div className="absolute -top-2 right-13 w-5 h-4 bg-sky-400/25 rounded-full blur-[0.5px] pointer-events-none" />

        {/* The Main Small Cloud Bubble */}
        <div className="relative flex flex-col gap-2 px-4 py-2.5 bg-gradient-to-br from-cyan-950/70 via-sky-900/40 to-blue-950/60 border border-cyan-400/35 backdrop-blur-xl rounded-[22px] rounded-br-[6px] shadow-[0_4px_25px_rgba(6,182,212,0.18)]">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-300 flex-shrink-0 mt-0.5 border border-cyan-400/30">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-xs font-mono text-cyan-400/80 tracking-wider uppercase">
                  You
                </span>
                {attachments && attachments.length > 0 && (
                  <span className="text-[10px] font-medium bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{attachments.length} मीडिया संलग्न</span>
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-normal text-white leading-relaxed break-words">
                {text}
              </p>
            </div>
          </div>

          {/* Attached Media Previews */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-cyan-500/20">
              {attachments.map((item) => (
                <div
                  key={item.id}
                  className="relative group/media rounded-xl overflow-hidden border border-cyan-400/40 bg-black/40 shadow-sm"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity flex items-end p-1">
                    <span className="text-[9px] text-zinc-300 truncate max-w-full">
                      {item.type === 'camera' ? '📷 कैमरा' : item.type === 'gallery' ? '🖼️ गैलरी' : item.type === 'video' ? '🎬 वीडियो' : '📸 फोटो'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating cloudlet droplets / tail */}
        <div className="flex justify-end items-center gap-1.5 mt-1 mr-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400/40 border border-cyan-300/40 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/30 border border-cyan-300/30 translate-y-0.5" />
          <span className="w-1 h-1 rounded-full bg-cyan-400/20 translate-y-1" />
        </div>
      </div>
    </div>
  );
};
