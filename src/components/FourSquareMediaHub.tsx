import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Film,
  Sparkles,
  Image as ImageIcon,
  Check,
  Upload,
  RefreshCw,
  Eye,
  Plus,
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
  Send,
  Smartphone,
  CheckSquare,
  Square,
  Sparkle,
} from 'lucide-react';
import { PhotoItem, VideoItem, AttachedMedia } from '../types';

export type FourSquareTab = 'menu' | 'photo' | 'video' | 'gallery' | 'camera';

interface FourSquareMediaHubProps {
  isOpen: boolean;
  initialTab?: FourSquareTab;
  onClose: () => void;
  photos: PhotoItem[];
  videos: VideoItem[];
  onSavePhotoToGallery: (photo: PhotoItem) => void;
  onGeneratePhoto: (prompt: string, style: string, aspectRatio: '1:1' | '16:9' | '9:16') => Promise<void>;
  onGenerateVideo: (prompt: string, motion: string, style: string, aspectRatio: '16:9' | '9:16') => Promise<void>;
  isGeneratingPhoto: boolean;
  isGeneratingVideo: boolean;
  onAttachMedia: (items: AttachedMedia[]) => void;
}

export const FourSquareMediaHub: React.FC<FourSquareMediaHubProps> = ({
  isOpen,
  initialTab = 'menu',
  onClose,
  photos,
  videos,
  onSavePhotoToGallery,
  onGeneratePhoto,
  onGenerateVideo,
  isGeneratingPhoto,
  isGeneratingVideo,
  onAttachMedia,
}) => {
  const [activeTab, setActiveTab] = useState<FourSquareTab>(initialTab);

  // Gallery multi-selection state ("जितना सेलेक्ट करना हो उतना हो जाए")
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'device'>('all');

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Photo generator tab state
  const [photoPrompt, setPhotoPrompt] = useState('');
  const [photoStyle, setPhotoStyle] = useState<'photorealistic' | 'cinematic' | 'anime' | '3d-render'>('photorealistic');

  // Video generator tab state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoMotion, setVideoMotion] = useState<'cinematic-zoom' | 'pan-orbit' | 'slow-motion' | 'hyperlapse'>('cinematic-zoom');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedGalleryIds([]);
      setCapturedPhotoUrl(null);
      setUploadFeedback(null);
    } else {
      stopCamera();
    }
  }, [isOpen, initialTab]);

  // Handle camera start/stop when entering/leaving camera tab
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, cameraFacing]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhotoUrl(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('आपका ब्राउज़र कैमरा सपोर्ट नहीं करता या परमिशन नहीं है। (Camera not supported)');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play caught:', e));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'कैमरा परमिशन अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में कैमरा की अनुमति दें।'
          : 'कैमरा शुरू करने में समस्या आई। कृपया जांचें कि कैमरा अन्य ऐप द्वारा उपयोग में नहीं है।'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
  };

  // Attach captured camera photo to SearchBar
  const handleAttachCameraPhoto = () => {
    if (!capturedPhotoUrl) return;
    const newMedia: AttachedMedia = {
      id: `camera_${Date.now()}`,
      type: 'camera',
      url: capturedPhotoUrl,
      name: 'कैमरा फोटो (Camera Shot)',
      timestamp: Date.now(),
    };

    onSavePhotoToGallery({
      id: newMedia.id,
      prompt: 'कैमरा लाइव फोटो (Camera Capture)',
      imageUrl: capturedPhotoUrl,
      style: 'photorealistic',
      aspectRatio: '1:1',
      timestamp: Date.now(),
    });

    onAttachMedia([newMedia]);
    onClose();
  };

  // Gallery multi-select toggle: "मतलब कि एक बटन दबाया, उधर टिक हो गया"
  const toggleGallerySelection = (id: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or clear all
  const handleSelectAll = () => {
    const currentFiltered = galleryFilter === 'device'
      ? photos.filter((p) => p.id.startsWith('upload_') || p.id.startsWith('device_'))
      : photos;
    setSelectedGalleryIds(currentFiltered.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedGalleryIds([]);
  };

  // Attach selected gallery photos to SearchBar: "नीचे डन का ऑप्शन होना चाहिए। डन कर दिए तो उतनी उतना पिक्चर सर्च बार पर आ जाएंगी।"
  const handleAttachSelectedGallery = () => {
    const selectedPhotos = photos.filter((p) => selectedGalleryIds.includes(p.id));
    if (selectedPhotos.length === 0) return;

    const mediaList: AttachedMedia[] = selectedPhotos.map((p) => ({
      id: p.id,
      type: 'gallery',
      url: p.imageUrl,
      name: p.prompt || 'गैलरी फोटो',
      timestamp: Date.now(),
    }));

    onAttachMedia(mediaList);
    onClose();
  };

  // Upload custom file directly from phone / computer gallery:
  // "AI को दी गई फोटो नहीं, हमें गैलरी से फोटो लेना है। गैलरी में जो-जो फोटो होते हैं, उन्हें सेलेक्ट करना है"
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    const newIds: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: PhotoItem = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          prompt: file.name.replace(/\.[^/.]+$/, '') || 'फ़ोन गैलरी फोटो',
          imageUrl: dataUrl,
          style: 'photorealistic',
          aspectRatio: '1:1',
          timestamp: Date.now(),
        };
        onSavePhotoToGallery(newPhoto);
        newIds.push(newPhoto.id);
        addedCount++;

        // Automatically tick the freshly selected device photo!
        setSelectedGalleryIds((prev) => [...prev, newPhoto.id]);

        if (addedCount === files.length) {
          setUploadFeedback(`✓ ${addedCount} फोटो आपकी गैलरी से लोड की गईं और टिक हो गईं!`);
          setTimeout(() => setUploadFeedback(null), 4000);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same files can be re-selected if desired
    e.target.value = '';
  };

  // Direct AI send for Photo: "जो फोटो बना लेता है... मुझे इसमें कुछ और बटन वाला नहीं, मतलब कि AI भेज सके वाला"
  const handleSendPhotoToAI = (photo: PhotoItem) => {
    onAttachMedia([
      {
        id: photo.id,
        type: 'photo',
        url: photo.imageUrl,
        name: photo.prompt || 'AI फोटो',
        timestamp: Date.now(),
      },
    ]);
    onClose();
  };

  // Direct AI send for Video: "जो वीडियो बना लेता है... AI भेज सके वाला"
  const handleSendVideoToAI = (video: VideoItem) => {
    onAttachMedia([
      {
        id: video.id,
        type: 'video',
        url: video.videoUrl || video.thumbnailUrl || '',
        thumbnailUrl: video.thumbnailUrl || (video.keyframes && video.keyframes[0]),
        name: video.prompt || 'AI वीडियो',
        timestamp: Date.now(),
      },
    ]);
    onClose();
  };

  if (!isOpen) return null;

  const devicePhotosCount = photos.filter((p) => p.id.startsWith('upload_') || p.id.startsWith('device_')).length;
  const filteredPhotos = galleryFilter === 'device'
    ? photos.filter((p) => p.id.startsWith('upload_') || p.id.startsWith('device_'))
    : photos;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      id="cynthsis-four-square-hub"
    >
      <div
        className="bg-[#101218] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Tab Switcher */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-[#0b0d13]">
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab !== 'menu' && (
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="p-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="चार स्क्वायर मेन्यू पर वापस जाएं"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {activeTab === 'menu' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                    <span>चार स्क्वायर (4 Squares Media Hub)</span>
                  </>
                )}
                {activeTab === 'gallery' && (
                  <>
                    <FolderOpen className="w-5 h-5 text-emerald-400" />
                    <span>गैलरी (Phone & Device Gallery)</span>
                  </>
                )}
                {activeTab === 'photo' && (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span>फोटो बनाएं (AI Photo Creator)</span>
                  </>
                )}
                {activeTab === 'video' && (
                  <>
                    <Film className="w-5 h-5 text-cyan-400" />
                    <span>वीडियो बनाएं (AI Video Creator)</span>
                  </>
                )}
                {activeTab === 'camera' && (
                  <>
                    <Camera className="w-5 h-5 text-rose-400" />
                    <span>लाइव कैमरा (Live Camera Snap)</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-zinc-400 hidden sm:block">
                {activeTab === 'menu' && 'फोटो, वीडियो, गैलरी या कैमरा — चुनें और सीधे सर्च बार में AI के लिए भेजें'}
                {activeTab === 'gallery' && 'अपनी गैलरी की फोटो चुनें, टिक करें और नीचे डन (Done) दबाएं'}
                {activeTab === 'photo' && 'नई फोटो बनाएं और सीधे "AI को भेजें" दबाएं'}
                {activeTab === 'video' && 'नया 60fps वीडियो बनाएं और सीधे "AI को भेजें" दबाएं'}
                {activeTab === 'camera' && 'लाइव फोटो खींचें और सर्च बार में जोड़ें'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick switcher buttons */}
            <div className="hidden md:flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'photo' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                फोटो
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'video' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                वीडियो
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'gallery' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                गैलरी
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'camera' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                कैमरा
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* VIEW 1: THE 4 SQUARES MAIN MENU */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-medium">
                  Select a Module
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  चार मुख्य विकल्प (4 Squares)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  किसी भी स्क्वायर पर क्लिक करें — तुरंत ओपन होगा और सर्च बार में आ जाएगा
                </p>
              </div>

              {/* The 4 Distinct Squares Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
                {/* SQUARE 1: फोटो (Photo) */}
                <button
                  type="button"
                  id="four-square-photo-btn"
                  onClick={() => setActiveTab('photo')}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 via-zinc-900/60 to-zinc-950 border border-purple-500/30 hover:border-purple-400 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] flex flex-col items-center text-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      फोटो
                    </h4>
                    <span className="text-[11px] font-medium text-purple-400 block mt-0.5">
                      Photo AI
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      लिखकर नई AI फोटो बनाएं और AI को भेजें
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-purple-400/80 font-medium">
                    <span>ओपन करें</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* SQUARE 2: वीडियो (Video) */}
                <button
                  type="button"
                  id="four-square-video-btn"
                  onClick={() => setActiveTab('video')}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 via-zinc-900/60 to-zinc-950 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] flex flex-col items-center text-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <Film className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      वीडियो
                    </h4>
                    <span className="text-[11px] font-medium text-cyan-400 block mt-0.5">
                      Video Studio
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      60fps सिनेमैटिक AI वीडियो बनाएं और AI को भेजें
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-cyan-400/80 font-medium">
                    <span>ओपन करें</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* SQUARE 3: गैलरी (Gallery) */}
                <button
                  type="button"
                  id="four-square-gallery-btn"
                  onClick={() => setActiveTab('gallery')}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 via-zinc-900/60 to-zinc-950 border border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] flex flex-col items-center text-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      गैलरी
                    </h4>
                    <span className="text-[11px] font-medium text-emerald-400 block mt-0.5">
                      फोन से चुनें & टिक
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      अपनी फोटो टिक करें और डन करके सर्च बार में लाएं
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-emerald-400/80 font-medium">
                    <span>ओपन करें</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* SQUARE 4: कैमरा (Camera) */}
                <button
                  type="button"
                  id="four-square-camera-btn"
                  onClick={() => setActiveTab('camera')}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-950/40 via-zinc-900/60 to-zinc-950 border border-rose-500/30 hover:border-rose-400 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] flex flex-col items-center text-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:text-rose-300 group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                      कैमरा
                    </h4>
                    <span className="text-[11px] font-medium text-rose-400 block mt-0.5">
                      Live Camera
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      तुरंत लाइव फोटो खींचें और AI के लिए जोड़ें
                    </p>
                  </div>
                  <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-rose-400/80 font-medium">
                    <span>ओपन करें</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Info banner */}
              <div className="max-w-xl mx-auto p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-2xl flex items-center gap-3 text-xs text-zinc-300">
                <Eye className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  <strong>AI विज़न सपोर्ट:</strong> आपकी चुनी हुई गैलरी फोटो या नई बनाई गई तस्वीरें सर्च बार में जुड़ेंगी और Cynthsis AI उन्हें देखकर पूरा विश्लेषण करेगा।
                </span>
              </div>
            </div>
          )}

          {/* VIEW 2: गैलरी (GALLERY WITH PHONE UPLOAD & TICKMARK MULTI-SELECT) */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* PRIMARY PHONE/DEVICE UPLOAD CALLOUT BUTTON */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>फ़ोन / कंप्यूटर की गैलरी से फोटो लें</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                        गैलरी फोटो
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      अपने मोबाइल या कंप्यूटर से अपनी मनपसंद फोटो चुनें — चुनते ही टिकमार्क लग जाएगा।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    id="open-device-file-picker-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 transition-all cursor-pointer hover:scale-105"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📁 गैलरी से फोटो चुनें</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Upload Success Feedback Banner */}
              {uploadFeedback && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{uploadFeedback}</span>
                </div>
              )}

              {/* Sub-bar: Category Tabs & Select Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGalleryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      galleryFilter === 'all'
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    सभी फोटो ({photos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryFilter('device')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      galleryFilter === 'device'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>फोन / अपलोड फोटो ({devicePhotosCount})</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs">
                    {selectedGalleryIds.length > 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{selectedGalleryIds.length} फोटो टिक की गईं</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">फोटो पर क्लिक करके टिक करें</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-zinc-300 hover:text-cyan-400 underline cursor-pointer"
                    >
                      सब सेलेक्ट करें
                    </button>
                    {selectedGalleryIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs text-rose-400 hover:text-rose-300 underline ml-2 cursor-pointer"
                      >
                        हटाएं
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos Grid with Explicit Tickmarks */}
              {filteredPhotos.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 bg-zinc-900/30 border border-zinc-800/60 rounded-3xl">
                  <Smartphone className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-zinc-300">कोई फोन फोटो उपलब्ध नहीं है</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    ऊपर दिए गए "📁 गैलरी से फोटो चुनें" बटन को दबाकर अपने फ़ोन या कंप्यूटर से फोटो अपलोड करें
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[48vh] overflow-y-auto p-1">
                  {filteredPhotos.map((photo, idx) => {
                    const isSelected = selectedGalleryIds.includes(photo.id);
                    const isDevice = photo.id.startsWith('upload_') || photo.id.startsWith('device_');
                    const selectionIndex = selectedGalleryIds.indexOf(photo.id);

                    return (
                      <div
                        key={photo.id}
                        id={`gallery-photo-card-${photo.id}`}
                        onClick={() => toggleGallerySelection(photo.id)}
                        className={`group relative rounded-2xl overflow-hidden border-[2.5px] cursor-pointer transition-all duration-200 aspect-square select-none ${
                          isSelected
                            ? 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[0.98] bg-emerald-950/20'
                            : 'border-zinc-800 hover:border-zinc-600 hover:scale-[1.02] bg-zinc-900/60'
                        }`}
                        title="टिक करने के लिए क्लिक करें"
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.prompt}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Top-Right Tickmark Button: "एक बटन दबाया, उधर टिक हो गया" */}
                        <div
                          className="absolute top-2.5 right-2.5 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGallerySelection(photo.id);
                          }}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.9)] border-2 border-white scale-110'
                                : 'bg-black/60 text-white/70 hover:text-white border-2 border-white/60 hover:border-white hover:scale-110 backdrop-blur-sm'
                            }`}
                            aria-label={isSelected ? 'अन-सेलेक्ट करें' : 'सेलेक्ट करें'}
                          >
                            <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'text-white' : 'opacity-60'}`} />
                          </div>
                        </div>

                        {/* Top-Left: Selection sequence badge */}
                        {isSelected && (
                          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-lg bg-black/80 border border-emerald-400/60 text-emerald-300 font-bold text-[10px] shadow-sm">
                            #{selectionIndex + 1}
                          </div>
                        )}

                        {/* Device badge if uploaded from phone */}
                        {isDevice && !isSelected && (
                          <div className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-emerald-400 font-semibold text-[9px] border border-emerald-500/30">
                            📱 फ़ोन फोटो
                          </div>
                        )}

                        {/* Bottom Status / Caption */}
                        <div
                          className={`absolute inset-x-0 bottom-0 p-2 text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-950/90 border-t border-emerald-500/40 text-emerald-200'
                              : 'bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white'
                          }`}
                        >
                          <p className="text-[11px] font-semibold truncate leading-tight flex items-center gap-1">
                            {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                            <span>{photo.prompt}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DEDICATED STICKY BOTTOM BAR: "और नीचे डन का ऑप्शन होना चाहिए। डन कर दिए तो उतनी उतना पिक्चर सर्च बार पर आ जाएंगी।" */}
              <div className="sticky bottom-0 bg-[#0d0f15]/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-zinc-750 flex items-center justify-between gap-3 shadow-2xl">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {selectedGalleryIds.length > 0 ? (
                        <span className="text-emerald-400">
                          ✓ {selectedGalleryIds.length} फोटो सेलेक्ट की गईं
                        </span>
                      ) : (
                        <span className="text-zinc-400">फोटो चुनकर टिकमार्क लगाएं</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    "डन" दबाते ही ये सभी तस्वीरें सर्च बार में आ जाएंगी और AI उन्हें देख सकेगा
                  </p>
                </div>

                <button
                  type="button"
                  id="gallery-done-btn"
                  onClick={handleAttachSelectedGallery}
                  disabled={selectedGalleryIds.length === 0}
                  className="px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>डन (Done)</span>
                  {selectedGalleryIds.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-black/40 text-xs font-bold flex items-center justify-center ml-0.5">
                      {selectedGalleryIds.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: फोटो जनरेटर (PHOTO GENERATOR WITH DIRECT "AI को भेजें" BUTTON) */}
          {activeTab === 'photo' && (
            <div className="space-y-5">
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm text-zinc-200 font-bold block">
                    क्या फोटो बनाना है लिखें (Photo Prompt):
                  </label>
                  <span className="text-[11px] text-purple-400">AI इमेज जनरेशन</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={photoPrompt}
                    onChange={(e) => setPhotoPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && photoPrompt.trim() && !isGeneratingPhoto) {
                        onGeneratePhoto(photoPrompt.trim(), photoStyle, '1:1');
                      }
                    }}
                    placeholder="उदा: बगीचे में खिलता हुआ लाल गुलाब, बारिश में खिड़की पर चाय का कप..."
                    className="flex-1 bg-[#151720] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!photoPrompt.trim()) return;
                      await onGeneratePhoto(photoPrompt.trim(), photoStyle, '1:1');
                    }}
                    disabled={isGeneratingPhoto || !photoPrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 cursor-pointer shrink-0"
                  >
                    {isGeneratingPhoto ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>फोटो बन रही है...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>✨ फोटो बनाएं</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-zinc-400">आइडिया:</span>
                  {[
                    'बगीचे में खूबसूरत मोर',
                    'बारिश में गर्म चाय का कप',
                    'सूर्यास्त के समय समुद्र तट',
                    'अंतरिक्ष में घूमती पृथ्वी',
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setPhotoPrompt(idea)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo list with single "AI को भेजें" button */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                    बनी हुई तस्वीरें (सीधे AI को भेजें):
                  </h4>
                  <span className="text-xs text-zinc-400">
                    बटन दबाते ही सर्च बार में जुड़ जाएगी
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[48vh] overflow-y-auto p-1">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-400 transition-all aspect-square bg-zinc-900 flex flex-col justify-end p-2.5 shadow-md"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.prompt}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      <div className="relative z-10 flex flex-col gap-1.5 text-left">
                        <p className="text-[11px] text-zinc-200 line-clamp-2 leading-tight font-medium">
                          {photo.prompt}
                        </p>
                        {/* THE SINGLE CLEAR BUTTON: AI को भेजें */}
                        <button
                          type="button"
                          id={`send-photo-to-ai-${photo.id}`}
                          onClick={() => handleSendPhotoToAI(photo)}
                          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>🚀 AI को भेजें</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: वीडियो जनरेटर (VIDEO GENERATOR WITH DIRECT "AI को भेजें" BUTTON) */}
          {activeTab === 'video' && (
            <div className="space-y-5">
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm text-zinc-200 font-bold block">
                    क्या वीडियो बनाना है लिखें (Video Prompt):
                  </label>
                  <span className="text-[11px] text-cyan-400">60fps AI वीडियो</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && videoPrompt.trim() && !isGeneratingVideo) {
                        onGenerateVideo(videoPrompt.trim(), videoMotion, 'cinematic', '16:9');
                      }
                    }}
                    placeholder="उदा: आसमान में उड़ता हुआ बाज, समुद्र की गरजती लहरें, अंतरिक्ष में रॉकेट..."
                    className="flex-1 bg-[#151720] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!videoPrompt.trim()) return;
                      await onGenerateVideo(videoPrompt.trim(), videoMotion, 'cinematic', '16:9');
                    }}
                    disabled={isGeneratingVideo || !videoPrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/30 cursor-pointer shrink-0"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>वीडियो बन रहा है...</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-4 h-4" />
                        <span>🎬 वीडियो बनाएं</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-zinc-400">आइडिया:</span>
                  {[
                    'उड़ता हुआ ड्रोन शॉट',
                    'पानी पर तैरती नाव',
                    'तेज गति से दौड़ती ट्रेन',
                    'घूमती हुई पृथ्वी',
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setVideoPrompt(idea)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              {/* Videos list with single "AI को भेजें" button */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
                    बने हुए वीडियो (सीधे AI को भेजें):
                  </h4>
                  <span className="text-xs text-zinc-400">
                    सर्च बार में जोड़कर AI से विश्लेषण करवाएं
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[48vh] overflow-y-auto p-1">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="group relative rounded-2xl overflow-hidden border border-zinc-800 hover:border-cyan-400 transition-all bg-black/60 aspect-video flex flex-col justify-end p-3 shadow-md"
                    >
                      {vid.thumbnailUrl && (
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.prompt}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <p className="text-xs text-white font-semibold truncate flex-1">
                          {vid.prompt}
                        </p>
                        {/* THE SINGLE CLEAR BUTTON: AI को भेजें */}
                        <button
                          type="button"
                          id={`send-video-to-ai-${vid.id}`}
                          onClick={() => handleSendVideoToAI(vid)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-102 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>🚀 AI को भेजें</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: कैमरा (LIVE CAMERA SNAP) */}
          {activeTab === 'camera' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl flex items-center justify-center">
                {capturedPhotoUrl ? (
                  <img
                    src={capturedPhotoUrl}
                    alt="Captured photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />
                    {!cameraActive && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-zinc-400 gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-rose-400" />
                        <span className="text-xs">कैमरा शुरू हो रहा है...</span>
                      </div>
                    )}
                  </>
                )}

                {/* Camera error message */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 gap-3">
                    <Camera className="w-10 h-10 text-rose-400/80" />
                    <p className="text-sm text-rose-300 max-w-md">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>पुनः प्रयास करें</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Action Controls */}
              <div className="flex items-center justify-center gap-3">
                {capturedPhotoUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhotoUrl(null);
                        startCamera();
                      }}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-2xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>फिर से फोटो लें</span>
                    </button>
                    <button
                      type="button"
                      id="attach-camera-done-btn"
                      onClick={handleAttachCameraPhoto}
                      className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-sm font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>डन (Done) — सर्च बार में जोड़ें</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'))
                      }
                      className="px-3.5 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>कैमरा बदलें ({cameraFacing === 'user' ? 'फ्रंट' : 'बैक'})</span>
                    </button>
                    <button
                      type="button"
                      id="snap-camera-btn"
                      onClick={handleCapturePhoto}
                      disabled={!cameraActive}
                      className="px-7 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-40 text-white text-sm font-bold rounded-2xl flex items-center gap-2 shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>फोटो खींचें (Snap Photo)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
