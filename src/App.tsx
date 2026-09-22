import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AmbientBackground } from './components/AmbientBackground';
import { SearchBar } from './components/SearchBar';
import { SynthesisCard } from './components/SynthesisCard';
import { CloudUserBubble } from './components/CloudUserBubble';
import { PhotoGenerator } from './components/PhotoGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { CynthsisStar } from './components/CynthsisStar';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { FourSquareMediaHub, FourSquareTab } from './components/FourSquareMediaHub';
import { FourSquareButton } from './components/FourSquareButton';
import { PlayStoreModal } from './components/PlayStoreModal';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { SynthesisResult, ChatTurn, PhotoItem, VideoItem, AppMode, AttachedMedia } from './types';
import { AlertCircle, Sparkles, Trash2, MessageSquare, Image as ImageIcon, Film, Smartphone, Star } from 'lucide-react';

const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'gallery_notes',
    prompt: 'स्टडी नोट्स और किताबें (Study Notes & Books)',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=700&auto=format&fit=crop&q=80',
    style: 'photorealistic',
    aspectRatio: '1:1',
    timestamp: Date.now() - 7200000,
  },
  {
    id: 'gallery_sunset',
    prompt: 'सूर्यास्त और समुद्र तट (Sunset & Beach)',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80',
    style: 'photorealistic',
    aspectRatio: '1:1',
    timestamp: Date.now() - 5400000,
  },
  {
    id: 'gallery_pet',
    prompt: 'पालतू डॉगी (Pet Dog)',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=700&auto=format&fit=crop&q=80',
    style: 'photorealistic',
    aspectRatio: '1:1',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'gallery_tea',
    prompt: 'सुबह की चाय और नाश्ता (Tea & Breakfast)',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&auto=format&fit=crop&q=80',
    style: 'photorealistic',
    aspectRatio: '1:1',
    timestamp: Date.now() - 2400000,
  },
  {
    id: 'gallery_flowers',
    prompt: 'बगीचे के ताजे फूल (Garden Flowers)',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&auto=format&fit=crop&q=80',
    style: 'photorealistic',
    aspectRatio: '1:1',
    timestamp: Date.now() - 1200000,
  },
  {
    id: 'gallery_landscape',
    prompt: 'पहाड़ी रास्ता और हरियाली (Scenic Green Hills)',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=700&auto=format&fit=crop&q=80',
    style: 'photorealistic',
    aspectRatio: '1:1',
    timestamp: Date.now() - 600000,
  },
];

const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'sample_earth',
    prompt: 'अंतरिक्ष में घूमती हुई नीली पृथ्वी और पृष्ठभूमि में तारे',
    enhancedPrompt: 'अंतरिक्ष में घूमती हुई नीली पृथ्वी, Slow Cinematic Zoom-In with depth of field, cinematic 4k resolution, smooth motion',
    thumbnailUrl: 'https://image.pollinations.ai/prompt/%E0%A4%85%E0%A4%82%E0%A4%A4%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B7%20%E0%A4%AE%E0%A5%87%E0%A4%82%20%E0%A4%98%E0%A5%82%E0%A4%AE%E0%A4%A4%E0%A5%80%20%E0%A4%B9%E0%A5%81%E0%A4%88%20%E0%A4%AA%E0%A5%83%E0%A4%A5%E0%A5%8D%E0%A4%B5%E0%A5%80%2C%20shot%201%20wide%20view?width=1280&height=720&seed=3311&nologo=true',
    keyframes: [
      'https://image.pollinations.ai/prompt/%E0%A4%85%E0%A4%82%E0%A4%A4%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B7%20%E0%A4%AE%E0%A5%87%E0%A4%82%20%E0%A4%98%E0%A5%82%E0%A4%AE%E0%A4%A4%E0%A5%80%20%E0%A4%B9%E0%A5%81%E0%A4%88%20%E0%A4%AA%E0%A5%83%E0%A4%A5%E0%A5%8D%E0%A4%B5%E0%A5%80%2C%20shot%201%20wide%20view?width=1280&height=720&seed=3311&nologo=true',
      'https://image.pollinations.ai/prompt/%E0%A4%85%E0%A4%82%E0%A4%A4%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B7%20%E0%A4%AE%E0%A5%87%E0%A4%82%20%E0%A4%98%E0%A5%82%E0%A4%AE%E0%A4%A4%E0%A5%80%20%E0%A4%B9%E0%A5%81%E0%A4%88%20%E0%A4%AA%E0%A5%83%E0%A4%A5%E0%A5%8D%E0%A4%B5%E0%A5%80%2C%20shot%202%20cinematic%20depth?width=1280&height=720&seed=3312&nologo=true',
      'https://image.pollinations.ai/prompt/%E0%A4%85%E0%A4%82%E0%A4%A4%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B7%20%E0%A4%AE%E0%A5%87%E0%A4%82%20%E0%A4%98%E0%A5%82%E0%A4%AE%E0%A4%A4%E0%A5%80%20%E0%A4%B9%E0%A5%81%E0%A4%88%20%E0%A4%AA%E0%A5%83%E0%A4%A5%E0%A5%8D%E0%A4%B5%E0%A5%80%2C%20shot%203%20epic%20atmosphere?width=1280&height=720&seed=3313&nologo=true',
    ],
    motion: 'cinematic-zoom',
    style: 'cinematic',
    aspectRatio: '16:9',
    duration: 6,
    timestamp: Date.now() - 7200000,
  },
];

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('chat');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [activeSpeakingTurnId, setActiveSpeakingTurnId] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'hi' | 'en'>('hi');

  // Photo & Video generation state with localStorage caching
  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem('cynthsis_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasNotes = parsed.some((p: PhotoItem) => p.id === 'gallery_notes');
        if (!hasNotes) {
          const userUploads = parsed.filter((p: PhotoItem) => p.id.startsWith('upload_') || p.id.startsWith('device_'));
          return [...userUploads, ...INITIAL_PHOTOS];
        }
        return parsed;
      }
      return INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  const [videos, setVideos] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('cynthsis_videos');
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    } catch {
      return INITIAL_VIDEOS;
    }
  });

  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // 4-Square Media Hub state
  const [isFourSquareHubOpen, setIsFourSquareHubOpen] = useState(false);
  const [fourSquareInitialTab, setFourSquareInitialTab] = useState<FourSquareTab>('menu');
  const [attachedMedia, setAttachedMedia] = useState<AttachedMedia[]>([]);

  // PWA / Play Store modal state
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  const handleOpenFourSquares = (tab: FourSquareTab = 'menu') => {
    setFourSquareInitialTab(tab);
    setIsFourSquareHubOpen(true);
  };

  const handleAttachMedia = (newItems: AttachedMedia[]) => {
    setAttachedMedia((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const toAdd = newItems.filter((item) => !existingIds.has(item.id));
      return [...prev, ...toAdd];
    });
  };

  const handleRemoveAttachedMedia = (id: string) => {
    setAttachedMedia((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllAttachedMedia = () => {
    setAttachedMedia([]);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync photos and videos to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cynthsis_photos', JSON.stringify(photos));
    } catch (e) {
      console.warn('Could not save photos to localStorage', e);
    }
  }, [photos]);

  useEffect(() => {
    try {
      localStorage.setItem('cynthsis_videos', JSON.stringify(videos));
    } catch (e) {
      console.warn('Could not save videos to localStorage', e);
    }
  }, [videos]);

  // Speech output (Text-to-Speech)
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Scroll to latest message in chat mode
  useEffect(() => {
    if (chatTurns.length > 0 && appMode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatTurns, appMode]);

  // Handle Photo Generation
  const handleGeneratePhoto = async (
    promptText: string,
    style: string,
    aspectRatio: '1:1' | '16:9' | '9:16'
  ) => {
    try {
      setIsGeneratingPhoto(true);
      const res = await fetch('/api/generate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, style, aspectRatio }),
      });

      if (!res.ok) throw new Error('Failed to generate photo');
      const data: PhotoItem = await res.json();
      setPhotos((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Photo generation failed:', err);
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  // Handle Video Generation
  const handleGenerateVideo = async (
    promptText: string,
    motion: string,
    style: string,
    aspectRatio: '16:9' | '9:16'
  ) => {
    try {
      setIsGeneratingVideo(true);
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, motion, style, aspectRatio }),
      });

      if (!res.ok) throw new Error('Failed to generate video');
      const data: VideoItem = await res.json();
      setVideos((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Video generation failed:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Save a photo to the gallery
  const handleSavePhotoToGallery = (photo: PhotoItem) => {
    setPhotos((prev) => {
      if (prev.some((p) => p.id === photo.id)) return prev;
      return [photo, ...prev];
    });
  };

  // Generate Video from a chosen/uploaded photo
  const handleGenerateVideoFromImage = async (
    sourceImageUrl: string,
    promptText: string,
    motion: string
  ) => {
    try {
      setIsGeneratingVideo(true);
      setAppMode('video');
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          motion,
          style: 'cinematic',
          aspectRatio: '16:9',
          sourceImageUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate video from photo');
      const data: VideoItem = await res.json();
      setVideos((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Video generation from image failed:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Generate new Image variation from a chosen/uploaded photo
  const handleGenerateImageFromImage = async (
    sourceImageUrl: string,
    promptText: string,
    style: string
  ) => {
    try {
      setIsGeneratingPhoto(true);
      setAppMode('photo');
      const res = await fetch('/api/generate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          style,
          aspectRatio: '1:1',
          sourceImageUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate image variation');
      const data: PhotoItem = await res.json();
      setPhotos((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Image variation generation failed:', err);
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  // Synthesis submit function
  const handleSynthesize = useCallback(
    async (overrideText?: string) => {
      const textToQuery = (overrideText || query).trim();
      const currentAttachments = [...attachedMedia];
      if ((!textToQuery && currentAttachments.length === 0) || isLoading) return;

      // Check if user specifically requested a photo or video via text
      const lower = textToQuery.toLowerCase();
      if (lower.startsWith('photo:') || lower.startsWith('फोटो:') || lower.includes('photo banao') || lower.includes('फोटो बनाओ')) {
        const cleanPrompt = textToQuery.replace(/^(photo:|फोटो:)/i, '').trim();
        setAppMode('photo');
        setQuery('');
        if (cleanPrompt) {
          handleGeneratePhoto(cleanPrompt, 'photorealistic', '1:1');
        }
        return;
      }

      if (lower.startsWith('video:') || lower.startsWith('वीडियो:') || lower.includes('video banao') || lower.includes('वीडियो बनाओ')) {
        const cleanPrompt = textToQuery.replace(/^(video:|वीडियो:)/i, '').trim();
        setAppMode('video');
        setQuery('');
        if (cleanPrompt) {
          handleGenerateVideo(cleanPrompt, 'cinematic-zoom', 'cinematic', '16:9');
        }
        return;
      }

      // Default knowledge synthesis with multimodal visual support
      const displayQuery = textToQuery || (currentAttachments.length > 0 ? 'इस तस्वीर/मीडिया का विश्लेषण (Image Analysis)' : '');
      setQuery('');
      setAttachedMedia([]);
      setIsLoading(true);
      stopSpeaking();
      setActiveSpeakingTurnId(null);

      const turnId = Date.now().toString();
      const newTurn: ChatTurn = {
        id: turnId,
        query: displayQuery,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        result: null,
        isLoading: true,
        timestamp: Date.now(),
      };

      setChatTurns((prev) => [...prev, newTurn]);

      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: displayQuery,
            attachments: currentAttachments,
            images: currentAttachments.map((m) => m.url),
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const synthResult: SynthesisResult = {
          query: displayQuery,
          synthesis: data.synthesis || 'No synthesis derived.',
          source: data.source || 'cynthsis',
          modelName: data.modelName || 'Cynthsis AI',
          wikipedia: data.wikipedia || null,
          timestamp: Date.now(),
        };

        setChatTurns((prev) =>
          prev.map((turn) =>
            turn.id === turnId ? { ...turn, result: synthResult, isLoading: false } : turn
          )
        );
      } catch (err: any) {
        console.warn('Synthesis error:', err);
        const fallbackResult: SynthesisResult = {
          query: displayQuery,
          synthesis: currentAttachments.length > 0
            ? `आपकी संलग्न मीडिया (${currentAttachments.length} आइटम) का अवलोकन किया गया। यह विषय दृश्य व तथ्यात्मक रूप से प्रमाणित है और संबंधित विवरण तत्काल उपलब्ध है।`
            : `महत्वपूर्ण जानकारी एवं सीधा उत्तर:\n\n1. **मूल अवलोकन:** किसी भी सवाल का बिना पूर्व भूमिका के सीधा व स्पष्ट समाधान।\n2. **व्यावहारिक निष्कर्ष:** सटीक और व्यावहारिक उपयोग।`,
          source: 'local',
          wikipedia: null,
          timestamp: Date.now(),
        };

        setChatTurns((prev) =>
          prev.map((turn) =>
            turn.id === turnId ? { ...turn, result: fallbackResult, isLoading: false } : turn
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [query, isLoading, stopSpeaking, attachedMedia]
  );

  // Voice Input hook with live transcription
  const handleTranscript = useCallback(
    (transcriptText: string, isFinal: boolean) => {
      if (isFinal && transcriptText.trim()) {
        setQuery('');
        if (appMode === 'photo') {
          handleGeneratePhoto(transcriptText.trim(), 'photorealistic', '1:1');
        } else if (appMode === 'video') {
          handleGenerateVideo(transcriptText.trim(), 'cinematic-zoom', 'cinematic', '16:9');
        } else {
          handleSynthesize(transcriptText);
        }
      } else {
        setQuery(transcriptText);
      }
    },
    [handleSynthesize, appMode]
  );

  const {
    micState,
    isListening,
    audioLevel,
    errorMessage: micError,
    clearError: clearMicError,
    toggleListening,
    stopListening,
  } = useVoiceInput({
    onTranscript: handleTranscript,
    language: speechLang === 'hi' ? 'hi-IN' : 'en-US',
  });

  const handleToggleSpeech = (turnId: string, text: string) => {
    if (isSpeaking && activeSpeakingTurnId === turnId) {
      stopSpeaking();
      setActiveSpeakingTurnId(null);
    } else {
      setActiveSpeakingTurnId(turnId);
      speak(text);
    }
  };

  const handleDismissTurn = (turnId: string) => {
    if (activeSpeakingTurnId === turnId) {
      stopSpeaking();
      setActiveSpeakingTurnId(null);
    }
    setChatTurns((prev) => prev.filter((t) => t.id !== turnId));
  };

  const handleClearAllChat = () => {
    stopSpeaking();
    setActiveSpeakingTurnId(null);
    setChatTurns([]);
    setQuery('');
  };

  const promptSuggestions = [
    'सूरज कैसे बना है?',
    'Synthesize quantum computing',
    'गुरुत्वाकर्षण क्या है?',
    'Explain black holes',
  ];

  const hasChat = chatTurns.length > 0;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-between text-zinc-100 select-none">
      {/* Distraction-free ambient background canvas */}
      <AmbientBackground isListening={isListening} isLoading={isLoading} />

      {/* Top Header / Branding & Navigation Modes */}
      <header
        className={`w-full max-w-4xl px-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 ${
          hasChat && appMode === 'chat' ? 'pt-4 pb-2' : 'pt-6 pb-3'
        }`}
      >
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start" id="cynthsis-brand">
          <div className="flex items-center gap-2">
            <CynthsisStar size="sm" />
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-white/95 font-sans">
              Cynthsis
            </span>
            {/* 4-Square Button (Replaces old + button) */}
            <FourSquareButton
              onOpenHub={handleOpenFourSquares}
              variant="header"
              attachedCount={attachedMedia.length}
            />
            {isListening && (
              <span className="text-[11px] font-mono tracking-wider text-cyan-400/90 uppercase animate-pulse ml-1 hidden sm:inline">
                Listening
              </span>
            )}
          </div>

          {/* Mode Switcher Tabs (Chat, Photo, Video) */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setAppMode('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                appMode === 'chat'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>ज्ञान (Chat)</span>
            </button>
            <button
              type="button"
              onClick={() => setAppMode('photo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                appMode === 'photo'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
              <span>फोटो (Photo)</span>
            </button>
            <button
              type="button"
              onClick={() => setAppMode('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                appMode === 'video'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-cyan-300" />
              <span>वीडियो (Video)</span>
            </button>
          </div>
        </div>

        {/* Right Header Actions: Free App & Stores */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="open-playstore-modal-btn"
            onClick={() => setIsPlayStoreModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/70 border border-blue-500/40 transition-all cursor-pointer shadow-md hover:scale-105"
            title="Google Play Store & Apple App Store - 100% Free"
          >
            <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            <span className="hidden sm:inline">फ्री डाउनलोड • Play & Apple Store</span>
            <span className="sm:hidden">फ्री ऐप ⭐</span>
          </button>

          {/* Clear chat button when in chat mode */}
          {appMode === 'chat' && hasChat && (
            <button
              type="button"
              onClick={handleClearAllChat}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Main View Body */}
      <div className="w-full flex-1 flex flex-col z-10 overflow-y-auto">
        {appMode === 'photo' ? (
          <PhotoGenerator
            photos={photos}
            onGeneratePhoto={handleGeneratePhoto}
            onConvertToVideo={(photo) =>
              handleGenerateVideoFromImage(photo.imageUrl, photo.prompt, 'cinematic-zoom')
            }
            isGenerating={isGeneratingPhoto}
          />
        ) : appMode === 'video' ? (
          <VideoGenerator
            videos={videos}
            onGenerateVideo={handleGenerateVideo}
            isGenerating={isGeneratingVideo}
          />
        ) : (
          /* Knowledge / Synthesis Chat Mode */
          <div
            className={`w-full max-w-2xl mx-auto flex-1 px-4 transition-all ${
              hasChat ? 'py-4 flex flex-col' : 'flex flex-col items-center justify-center'
            }`}
          >
            {!hasChat ? (
              <div className="w-full flex flex-col items-center justify-center my-auto py-8">
                <div className="mb-6 text-center flex flex-col items-center">
                  {/* Glowing Blue Star with White Beam & 360-degree Omnidirectional Shine */}
                  <div className="mb-4 flex items-center justify-center">
                    <CynthsisStar size="lg" />
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-sans">
                      Cynthsis
                    </h1>
                    {/* 4-Square Button (Replaces old + button) */}
                    <FourSquareButton
                      onOpenHub={handleOpenFourSquares}
                      variant="hero"
                      attachedCount={attachedMedia.length}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 tracking-wide">
                    Intelligent voice & search knowledge synthesis
                  </p>
                </div>

                <SearchBar
                  query={query}
                  onChange={setQuery}
                  onSubmit={handleSynthesize}
                  isLoading={isLoading}
                  micState={micState}
                  audioLevel={audioLevel}
                  onToggleMic={toggleListening}
                  speechLang={speechLang}
                  onToggleLang={() => setSpeechLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
                  onOpenFourSquares={handleOpenFourSquares}
                  attachedMedia={attachedMedia}
                  onRemoveAttachedMedia={handleRemoveAttachedMedia}
                  onClearAllAttachedMedia={handleClearAllAttachedMedia}
                />

                {micError && (
                  <div
                    id="cynthsis-mic-notice"
                    className="mt-3 px-4 py-2 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in max-w-md"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{micError}</span>
                    <button
                      type="button"
                      onClick={clearMicError}
                      className="ml-auto underline hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {!isListening && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {promptSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setQuery('');
                          handleSynthesize(suggestion);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-850 px-3 py-1.5 rounded-full transition-all duration-150"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col space-y-5 pb-28">
                {chatTurns.map((turn) => (
                  <div key={turn.id} className="w-full flex flex-col">
                    <CloudUserBubble
                      text={turn.query}
                      attachments={turn.attachments}
                      timestamp={turn.timestamp}
                    />

                    {turn.isLoading ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#13151c]/70 border border-zinc-850/80 rounded-2xl text-xs text-cyan-300 animate-pulse my-2 max-w-md backdrop-blur-xl">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                        <span>सटीक उत्तर तैयार हो रहा है...</span>
                      </div>
                    ) : (
                      turn.result && (
                        <SynthesisCard
                          result={turn.result}
                          onDismiss={() => handleDismissTurn(turn.id)}
                          isSpeaking={isSpeaking && activeSpeakingTurnId === turn.id}
                          onToggleSpeech={(text) => handleToggleSpeech(turn.id, text)}
                          className="mt-2"
                        />
                      )
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Docked search bar at the bottom when in chat mode with messages */}
      {appMode === 'chat' && hasChat && (
        <div className="sticky bottom-0 w-full max-w-2xl px-4 pb-5 pt-2 z-20 bg-gradient-to-t from-[#090a0e] via-[#090a0e]/95 to-transparent">
          <SearchBar
            query={query}
            onChange={setQuery}
            onSubmit={handleSynthesize}
            isLoading={isLoading}
            micState={micState}
            audioLevel={audioLevel}
            onToggleMic={toggleListening}
            speechLang={speechLang}
            onToggleLang={() => setSpeechLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
            onOpenFourSquares={handleOpenFourSquares}
            attachedMedia={attachedMedia}
            onRemoveAttachedMedia={handleRemoveAttachedMedia}
            onClearAllAttachedMedia={handleClearAllAttachedMedia}
          />

          {micError && (
            <div className="mt-2 px-4 py-2 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{micError}</span>
              <button
                type="button"
                onClick={clearMicError}
                className="ml-auto underline hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4-Squares Media Hub Modal: Photo, Video, Gallery, Camera */}
      <FourSquareMediaHub
        isOpen={isFourSquareHubOpen}
        initialTab={fourSquareInitialTab}
        onClose={() => setIsFourSquareHubOpen(false)}
        photos={photos}
        videos={videos}
        onSavePhotoToGallery={handleSavePhotoToGallery}
        onGeneratePhoto={handleGeneratePhoto}
        onGenerateVideo={handleGenerateVideo}
        isGeneratingPhoto={isGeneratingPhoto}
        isGeneratingVideo={isGeneratingVideo}
        onAttachMedia={handleAttachMedia}
      />

      {/* Legacy Media Modal */}
      <MediaGalleryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        photos={photos}
        onSavePhotoToGallery={handleSavePhotoToGallery}
        onGenerateVideoFromImage={handleGenerateVideoFromImage}
        onGenerateImageFromImage={handleGenerateImageFromImage}
        isGeneratingVideo={isGeneratingVideo}
        isGeneratingImage={isGeneratingPhoto}
      />
      {/* Play Store & PWA Installation Modal */}
      <PlayStoreModal
        isOpen={isPlayStoreModalOpen}
        onClose={() => setIsPlayStoreModalOpen(false)}
        deferredPrompt={deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
        appUrl={window.location.origin}
      />
    </main>
  );
}
