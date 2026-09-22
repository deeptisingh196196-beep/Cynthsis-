import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
  Film,
  Sparkles,
  Image as ImageIcon,
  Check,
  Video,
  Download,
  Loader2,
  Maximize2,
} from 'lucide-react';
import { PhotoItem } from '../types';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  onSavePhotoToGallery: (photo: PhotoItem) => void;
  onGenerateVideoFromImage: (sourceImageUrl: string, prompt: string, motion: string) => Promise<void>;
  onGenerateImageFromImage: (sourceImageUrl: string, prompt: string, style: string) => Promise<void>;
  isGeneratingVideo: boolean;
  isGeneratingImage: boolean;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  onSavePhotoToGallery,
  onGenerateVideoFromImage,
  onGenerateImageFromImage,
  isGeneratingVideo,
  isGeneratingImage,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(() => (photos.length > 0 ? photos[0] : null));
  const [motionStyle, setMotionStyle] = useState<'cinematic-zoom' | 'pan-orbit' | 'slow-motion' | 'hyperlapse'>('cinematic-zoom');
  const [imageStyle, setImageStyle] = useState<'photorealistic' | 'cinematic' | 'digital-art' | 'anime'>('cinematic');
  const [customPrompt, setCustomPrompt] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newUploadedPhoto: PhotoItem = {
        id: `upload_${Date.now()}`,
        prompt: file.name.replace(/\.[^/.]+$/, '') || 'Uploaded user photo',
        imageUrl: dataUrl,
        style: 'photorealistic',
        aspectRatio: '1:1',
        timestamp: Date.now(),
      };
      // Set as selected photo and optionally save to gallery
      setSelectedPhoto(newUploadedPhoto);
      onSavePhotoToGallery(newUploadedPhoto);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateVideo = async () => {
    if (!selectedPhoto) return;
    const promptToUse = customPrompt.trim() || selectedPhoto.prompt || 'Cinematic photo motion';
    await onGenerateVideoFromImage(selectedPhoto.imageUrl, promptToUse, motionStyle);
    onClose();
  };

  const handleCreateImage = async () => {
    if (!selectedPhoto) return;
    const promptToUse = customPrompt.trim() || selectedPhoto.prompt || 'Artistic variation';
    await onGenerateImageFromImage(selectedPhoto.imageUrl, promptToUse, imageStyle);
    onClose();
  };

  const handleSaveCurrentPhoto = () => {
    if (!selectedPhoto) return;
    onSavePhotoToGallery(selectedPhoto);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
      id="cynthsis-media-gallery-modal"
    >
      <div
        className="bg-[#12141c] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/90 flex items-center justify-between bg-[#0e1017]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                फोटो & गैलरी स्टूडियो (Media Studio)
              </h2>
              <p className="text-xs text-zinc-400">
                फोटो चुनें या अपलोड करें — 1-क्लिक में वीडियो या नई इमेज बनाएं
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Gallery Picker + Right Selected Media Studio */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Gallery & Device Photos (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Upload Button Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-750 hover:border-cyan-500/60 rounded-2xl p-4 text-center cursor-pointer bg-zinc-900/40 hover:bg-cyan-950/10 transition-all flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-zinc-200">
                डिवाइस / गैलरी से फोटो अपलोड करें
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                PNG, JPG, WEBP इमेज चुनें (Choose Image)
              </p>
            </div>

            {/* Gallery Section Title */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                गैलरी फोटोज ({photos.length})
              </span>
              <span className="text-[11px] text-zinc-500">क्लिक कर चुनें</span>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {photos.map((photo) => {
                const isSelected = selectedPhoto?.id === photo.id;
                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.02] shadow-lg'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-cyan-500 text-black p-0.5 rounded-full shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Photo Action Studio (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-[#0e1017] border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
            {selectedPhoto ? (
              <div className="flex flex-col h-full space-y-4">
                {/* Photo Preview Stage */}
                <div className="relative w-full aspect-video sm:aspect-[16/10] bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.prompt}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm p-2 rounded-lg text-xs text-zinc-200 truncate flex items-center justify-between">
                    <span className="truncate pr-2 font-medium">{selectedPhoto.prompt}</span>
                    <button
                      type="button"
                      onClick={handleSaveCurrentPhoto}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                      title="गैलरी में सेव करें"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          <span>सेव हुआ!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>सेव करें</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional Custom Direction / Prompt input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    दृश्य या प्रभाव बताएं (वैकल्पिक / Optional Prompt):
                  </label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="उदा: 3D Camera Zoom, या Anime style remix..."
                    className="w-full bg-zinc-900 border border-zinc-750 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Generation Options: Video vs Image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Option 1: Generate Video */}
                  <div className="bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Film className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                          फोटो से वीडियो बनाएं
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mb-2">
                        इस फोटो को 60fps सिनेमाई मोशन और कैमरा मूवमेंट में बदलें।
                      </p>
                      {/* Motion selector */}
                      <select
                        value={motionStyle}
                        onChange={(e) => setMotionStyle(e.target.value as any)}
                        className="w-full bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 mb-3 focus:outline-none"
                      >
                        <option value="cinematic-zoom">🔍 Cinematic Zoom-In</option>
                        <option value="pan-orbit">🔄 3D Pan Orbit</option>
                        <option value="slow-motion">⏳ Smooth Slow Motion</option>
                        <option value="hyperlapse">⚡ Fast Hyperlapse</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateVideo}
                      disabled={isGeneratingVideo}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingVideo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>वीडियो बन रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5" />
                          <span>वीडियो जनरेट करें</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 2: Generate New Image */}
                  <div className="bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                          नई AI इमेज बनाएं
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mb-2">
                        इस फोटो से नया रूप, स्टाइल या आर्टिस्टिक वेरिएशन बनाएं।
                      </p>
                      {/* Style selector */}
                      <select
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value as any)}
                        className="w-full bg-zinc-850 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 mb-3 focus:outline-none"
                      >
                        <option value="cinematic">🎬 Cinematic 3D</option>
                        <option value="photorealistic">📸 Realistic 8K</option>
                        <option value="digital-art">🎨 Digital Art</option>
                        <option value="anime">🌸 Anime Aesthetic</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateImage}
                      disabled={isGeneratingImage}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>इमेज बन रही है...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>इमेज जनरेट करें</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm font-medium text-zinc-300">कोई फोटो चुनी नहीं गई है</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  बाईं ओर से कोई फोटो चुनें या अपने फोन/कंप्यूटर से नई फोटो अपलोड करें।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
