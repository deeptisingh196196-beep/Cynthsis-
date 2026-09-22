import React, { useState } from 'react';
import { Sparkles, Download, Maximize2, X, RefreshCw, Image as ImageIcon, Check, Loader2, Film } from 'lucide-react';
import { PhotoItem } from '../types';

interface PhotoGeneratorProps {
  photos: PhotoItem[];
  onGeneratePhoto: (prompt: string, style: string, aspectRatio: '1:1' | '16:9' | '9:16') => Promise<void>;
  onConvertToVideo?: (photo: PhotoItem) => void;
  isGenerating: boolean;
}

export const PhotoGenerator: React.FC<PhotoGeneratorProps> = ({
  photos,
  onGeneratePhoto,
  onConvertToVideo,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'photorealistic' | 'digital-art' | 'cinematic' | 'anime'>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const samplePrompts = [
    'सूरज की अंतरिक्ष से भव्य फोटो, सौर ज्वालाएं',
    'Futuristic flying car racing above neon clouds',
    'ताजमहल का सूर्यास्त का मनमोहक दृश्य, सुनहरी किरणें',
    'Bioluminescent enchanted forest at midnight, 8k',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGeneratePhoto(prompt.trim(), style, aspectRatio);
    }
  };

  const handleDownload = async (photo: PhotoItem) => {
    try {
      const response = await fetch(photo.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cynthsis-photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Fallback direct open
      window.open(photo.imageUrl, '_blank');
    }
  };

  const handleCopyPrompt = (photo: PhotoItem) => {
    navigator.clipboard.writeText(photo.prompt);
    setCopiedId(photo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4" id="cynthsis-photo-generator">
      {/* Creation Box */}
      <div className="bg-[#12141c]/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">AI Photo Generator</h2>
              <p className="text-xs text-zinc-400">अपनी कल्पना को उच्च-रिज़ॉल्यूशन फोटो में बदलें (Hindi & English supported)</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
            HD 8K Engine
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prompt input */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="फोटो का विवरण लिखें (उदा: अंतरिक्ष में चमकता हुआ सूरज, या Cyberpunk city in rain)..."
              rows={2}
              className="w-full bg-[#0d0e14] border border-zinc-750 focus:border-purple-500/60 rounded-xl p-3.5 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none transition-all"
            />
          </div>

          {/* Quick sample prompt chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-zinc-500 mr-1">आइडिया:</span>
            {samplePrompts.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(sample)}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Controls: Style & Aspect Ratio & Submit */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Style selector */}
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
                {(
                  [
                    { id: 'photorealistic', label: '📸 Realistic' },
                    { id: 'cinematic', label: '🎬 Cinematic' },
                    { id: 'digital-art', label: '🎨 Art' },
                    { id: 'anime', label: '🌸 Anime' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      style === s.id
                        ? 'bg-purple-600 text-white font-medium shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio */}
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
                {(
                  [
                    { id: '1:1', label: '1:1 Square' },
                    { id: '16:9', label: '16:9 Wide' },
                    { id: '9:16', label: '9:16 Story' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      aspectRatio === r.id
                        ? 'bg-purple-600 text-white font-medium shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              id="generate-photo-btn"
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                prompt.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                  <span>Generating Photo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>फोटो बनाएं (Generate)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Photos Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            Generated Gallery ({photos.length})
          </h3>
          {photos.length > 0 && (
            <span className="text-xs text-zinc-500">Click any image to view in HD or download</span>
          )}
        </div>

        {photos.length === 0 && !isGenerating ? (
          <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto mb-3 opacity-60" />
            <p className="text-sm text-zinc-300 font-medium">No photos generated yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              ऊपर अपना प्रॉम्प्ट टाइप करें या आइडिया चुनें और "फोटो बनाएं" पर क्लिक करें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Loading placeholder skeleton card if actively generating */}
            {isGenerating && (
              <div className="bg-zinc-900/80 border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[260px] animate-pulse">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                <p className="text-sm text-white font-medium">Creating your AI Photo...</p>
                <p className="text-xs text-zinc-400 mt-1">Applying high-resolution rendering</p>
              </div>
            )}

            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-[#12141c] border border-zinc-800 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
              >
                {/* Image Container */}
                <div
                  className={`w-full overflow-hidden bg-zinc-950 relative cursor-pointer ${
                    photo.aspectRatio === '16:9'
                      ? 'aspect-video'
                      : photo.aspectRatio === '9:16'
                      ? 'aspect-[9/16]'
                      : 'aspect-square'
                  }`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(photo);
                        }}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition-colors"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-black text-xs font-semibold flex items-center gap-1 shadow-md transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        {onConvertToVideo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onConvertToVideo(photo);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 shadow-md transition-colors"
                            title="इस फोटो से वीडियो बनाएं"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Video</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPrompt(photo);
                        }}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 text-xs transition-colors"
                        title="Copy Prompt"
                      >
                        {copiedId === photo.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Caption / Details */}
                <div className="p-3">
                  <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed font-normal">
                    {photo.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400">
                    <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-300">
                      {photo.style}
                    </span>
                    <span>{photo.aspectRatio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#12141c] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-[#0d0e14]">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 capitalize font-medium">
                  {selectedPhoto.style}
                </span>
                <p className="text-xs sm:text-sm text-zinc-200 truncate max-w-md font-medium">
                  {selectedPhoto.prompt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedPhoto)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HD
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="overflow-auto flex items-center justify-center p-2 bg-black max-h-[75vh]">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.prompt}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
