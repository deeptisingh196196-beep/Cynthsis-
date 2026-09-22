import React, { useState, useRef, useEffect } from 'react';
import { Video, Film, Play, Pause, RotateCcw, Download, Sparkles, Loader2, Maximize2, X, Check } from 'lucide-react';
import { VideoItem } from '../types';

interface VideoGeneratorProps {
  videos: VideoItem[];
  onGenerateVideo: (prompt: string, motion: string, style: string, aspectRatio: '16:9' | '9:16') => Promise<void>;
  isGenerating: boolean;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  videos,
  onGenerateVideo,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState('');
  const [motion, setMotion] = useState<'cinematic-zoom' | 'pan-orbit' | 'slow-motion' | 'hyperlapse'>('cinematic-zoom');
  const [style, setStyle] = useState<'cinematic' | 'photorealistic' | 'scifi' | 'nature'>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // Video playback & recording state
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const samplePrompts = [
    'अंतरिक्ष में घूमती हुई नीली पृथ्वी, चमकते तारे',
    'Flowing river with golden autumn leaves floating',
    'Futuristic neon highway with hyper-speed light trails',
    'Deep ocean magical bioluminescent glowing creatures',
  ];

  // Set first video as active if none selected
  useEffect(() => {
    if (videos.length > 0 && !activeVideo) {
      setActiveVideo(videos[0]);
    }
  }, [videos, activeVideo]);

  // Load keyframe images whenever activeVideo changes
  useEffect(() => {
    if (!activeVideo || !activeVideo.keyframes) return;
    loadedImagesRef.current = [];

    activeVideo.keyframes.forEach((src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        loadedImagesRef.current.push(img);
      };
    });

    startTimeRef.current = Date.now();
    setIsPlaying(true);
    setProgress(0);
  }, [activeVideo]);

  // Canvas 60fps render loop for cinematic visual video motion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeVideo) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localStartTime = Date.now();
    const duration = (activeVideo.duration || 6) * 1000;

    const render = () => {
      if (isPlaying) {
        const elapsed = (Date.now() - localStartTime) % duration;
        const currentProgress = elapsed / duration;
        setProgress(currentProgress);

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const images = loadedImagesRef.current;
        if (images.length > 0) {
          // Cross-fade interpolation between keyframe shots
          const imageIndex = Math.min(
            Math.floor(currentProgress * images.length),
            images.length - 1
          );
          const nextImageIndex = (imageIndex + 1) % images.length;
          const segmentProgress = (currentProgress * images.length) % 1;

          const img1 = images[imageIndex];
          const img2 = images[nextImageIndex];

          // Dynamic Camera Motion transforms
          ctx.save();
          let scale = 1;
          let dx = 0;
          let dy = 0;

          if (activeVideo.motion === 'cinematic-zoom') {
            scale = 1 + currentProgress * 0.15; // Smooth slow zoom-in
          } else if (activeVideo.motion === 'pan-orbit') {
            scale = 1.1;
            dx = Math.sin(currentProgress * Math.PI * 2) * 25; // Lateral orbit
          } else if (activeVideo.motion === 'slow-motion') {
            scale = 1.05 + Math.sin(currentProgress * Math.PI) * 0.05;
          } else {
            // Hyperlapse
            scale = 1 + (currentProgress % 0.25) * 0.4;
          }

          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2 + dx, -height / 2 + dy);

          // Draw base frame
          if (img1 && img1.complete) {
            ctx.drawImage(img1, 0, 0, width, height);
          }

          // Crossfade to next frame
          if (img2 && img2.complete && segmentProgress > 0.6) {
            ctx.globalAlpha = (segmentProgress - 0.6) / 0.4;
            ctx.drawImage(img2, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          }

          ctx.restore();
        } else {
          // Fallback animated particles/gradient while loading
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }

        // Atmospheric particle dust effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 20; i++) {
          const px = (Math.sin(i * 99 + currentProgress * 8) * 0.5 + 0.5) * width;
          const py = (Math.cos(i * 33 + currentProgress * 4) * 0.5 + 0.5) * height;
          ctx.beginPath();
          ctx.arc(px, py, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cinema Vignette
        const vignette = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.35,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.75
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, activeVideo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerateVideo(prompt.trim(), motion, style, aspectRatio);
    }
  };

  // Direct Video Download (.webm) using Canvas Stream & MediaRecorder
  const handleDownloadVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeVideo) return;

    try {
      setIsExporting(true);
      // Capture 30fps canvas stream
      const stream = canvas.captureStream(30);
      const recordedChunks: Blob[] = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cynthsis-video-${activeVideo.id}.webm`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setIsExporting(false);
      };

      mediaRecorder.start();
      // Record for 4 seconds of full motion cycle
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 4000);
    } catch (err) {
      console.warn('MediaRecorder export fallback:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4" id="cynthsis-video-generator">
      {/* Creation Box */}
      <div className="bg-[#12141c]/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">AI Video Generator</h2>
              <p className="text-xs text-zinc-400">सिनेमैटिक गति और दृश्यों के साथ वीडियो बनाएं (Hindi & English supported)</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
            60FPS Motion Engine
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="वीडियो का दृश्य बताएं (उदा: अंतरिक्ष में घूमती हुई पृथ्वी, या Flowing river in autumn forest)..."
              rows={2}
              className="w-full bg-[#0d0e14] border border-zinc-750 focus:border-cyan-500/60 rounded-xl p-3.5 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none transition-all"
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

          {/* Controls: Motion Camera & Aspect Ratio */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Motion selector */}
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
                {(
                  [
                    { id: 'cinematic-zoom', label: '🔍 Zoom-In' },
                    { id: 'pan-orbit', label: '🔄 Pan Orbit' },
                    { id: 'slow-motion', label: '⏳ Slow-Mo' },
                    { id: 'hyperlapse', label: '⚡ Hyperlapse' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotion(m.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      motion === m.id
                        ? 'bg-cyan-600 text-white font-medium shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio */}
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
                {(
                  [
                    { id: '16:9', label: '16:9 Cinema' },
                    { id: '9:16', label: '9:16 Reel' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      aspectRatio === r.id
                        ? 'bg-cyan-600 text-white font-medium shadow-sm'
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
              id="generate-video-btn"
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                prompt.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Generating Video...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-cyan-200" />
                  <span>वीडियो बनाएं (Generate)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Video Player Screen */}
      {activeVideo ? (
        <div className="bg-[#12141c] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl mb-8">
          {/* Top Video Header */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#0d0e14]">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                {activeVideo.motion.toUpperCase()}
              </span>
              <p className="text-xs sm:text-sm text-zinc-200 font-medium truncate max-w-sm sm:max-w-md">
                {activeVideo.prompt}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Video
                </>
              )}
            </button>
          </div>

          {/* Dynamic 60FPS Video Canvas Stage */}
          <div className="relative bg-black flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={activeVideo.aspectRatio === '9:16' ? 720 : 1280}
              height={activeVideo.aspectRatio === '9:16' ? 1280 : 720}
              className={`w-full max-h-[500px] object-contain ${
                activeVideo.aspectRatio === '9:16' ? 'max-w-[320px] mx-auto' : ''
              }`}
            />

            {/* Overlay Play/Pause Button on center hover */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
          </div>

          {/* Timeline & Playback Controls */}
          <div className="p-3 bg-[#0d0e14] border-t border-zinc-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Scrubber Progress Bar */}
            <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-75"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <span className="text-xs text-zinc-400 font-mono">
              {(progress * 6).toFixed(1)}s / 6.0s
            </span>
          </div>

          {/* Storyboard Keyframes Breakdown */}
          {activeVideo.keyframes && activeVideo.keyframes.length > 0 && (
            <div className="p-3.5 bg-zinc-950 border-t border-zinc-800/80">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Storyboard Keyframes (दृश्य क्रम):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {activeVideo.keyframes.map((kf, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-zinc-800 aspect-video">
                    <img
                      src={kf}
                      alt={`Scene ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                      Shot {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Videos List / History */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400" />
          Generated Videos ({videos.length})
        </h3>

        {videos.length === 0 && !isGenerating ? (
          <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3 opacity-60" />
            <p className="text-sm text-zinc-300 font-medium">No videos generated yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              ऊपर अपना वीडियो प्रॉम्प्ट लिखें और "वीडियो बनाएं" पर क्लिक करें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {isGenerating && (
              <div className="bg-zinc-900/80 border border-cyan-500/30 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[180px] animate-pulse">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                <p className="text-sm text-white font-medium">Rendering AI Video...</p>
                <p className="text-xs text-zinc-400 mt-1">Generating 60FPS motion keyframes</p>
              </div>
            )}

            {videos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActiveVideo(vid)}
                className={`group cursor-pointer bg-[#12141c] border rounded-2xl overflow-hidden transition-all duration-200 ${
                  activeVideo?.id === vid.id
                    ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="aspect-video bg-black relative overflow-hidden">
                  {vid.thumbnailUrl ? (
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300">
                    6s • {vid.aspectRatio}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-zinc-200 truncate font-medium">{vid.prompt}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 capitalize">{vid.motion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
