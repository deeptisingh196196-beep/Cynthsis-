import { useState, useEffect, useRef, useCallback } from 'react';
import { MicState } from '../types';

interface UseVoiceInputProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onListeningChange?: (isListening: boolean) => void;
  language?: string;
}

export function useVoiceInput({ onTranscript, onListeningChange, language = 'auto' }: UseVoiceInputProps) {
  const [micState, setMicState] = useState<MicState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<number | null>(null);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }

    // Stop audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setAudioLevel(0);
    setMicState('idle');
    onListeningChange?.(false);
  }, [onListeningChange]);

  const startListening = useCallback(async () => {
    setErrorMessage(null);
    setMicState('requesting');
    latestTranscriptRef.current = '';

    // 1. Request actual microphone permission via getUserMedia
    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by this browser.');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err);
      setMicState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
      } else {
        setErrorMessage(err.message || 'Unable to access microphone.');
      }
      return;
    }

    // 2. Set up AudioContext for real-time acoustic level visualization
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalized level between 0 and 1
          setAudioLevel(Math.min(1, avg / 128));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch (e) {
      console.warn('Audio level monitoring initialization warning:', e);
    }

    // 3. Set up Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Speech recognition not supported by browser, but microphone access succeeded
      setMicState('listening');
      onListeningChange?.(true);
      setErrorMessage(
        'Microphone is active! (Note: Live Speech-to-Text works best in Chromium-based browsers; you can also type your query directly).'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Determine language for speech recognition
      const LANG_MAP: Record<string, string> = {
        hi: 'hi-IN',
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        bn: 'bn-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        pa: 'pa-IN',
        ar: 'ar-SA',
        ja: 'ja-JP',
        zh: 'zh-CN',
        ru: 'ru-RU',
        it: 'it-IT',
        pt: 'pt-BR',
      };

      let recLang = 'hi-IN'; // Multi-lingual default
      if (language && language !== 'auto') {
        recLang = LANG_MAP[language] || language;
      } else if (typeof navigator !== 'undefined' && navigator.language) {
        recLang = navigator.language;
      }
      recognition.lang = recLang;

      recognition.onstart = () => {
        setMicState('listening');
        onListeningChange?.(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          latestTranscriptRef.current = currentText;

          if (finalTranscript.trim()) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            latestTranscriptRef.current = '';
            onTranscript(finalTranscript.trim(), true);
            stopListening();
            return;
          }

          // Live interim preview
          onTranscript(currentText, false);

          // Fast auto-submit if speaker pauses for >900ms after speaking at least 2 words
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          if (currentText.length > 5) {
            silenceTimerRef.current = window.setTimeout(() => {
              const textToSubmit = latestTranscriptRef.current.trim();
              if (textToSubmit) {
                latestTranscriptRef.current = '';
                onTranscript(textToSubmit, true);
                stopListening();
              }
            }, 900);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'no-speech') {
          // quiet
        } else if (event.error === 'not-allowed') {
          setErrorMessage('Speech recognition permission denied.');
          stopListening();
        } else {
          setErrorMessage(`Speech recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        const pending = latestTranscriptRef.current;
        if (pending && pending.trim()) {
          onTranscript(pending.trim(), true);
          latestTranscriptRef.current = '';
        }
        stopListening();
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setMicState('listening');
      onListeningChange?.(true);
    }
  }, [onTranscript, onListeningChange, stopListening]);

  const toggleListening = useCallback(() => {
    if (micState === 'listening' || micState === 'requesting') {
      stopListening();
    } else {
      startListening();
    }
  }, [micState, startListening, stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    micState,
    isListening: micState === 'listening',
    audioLevel,
    errorMessage,
    clearError: () => setErrorMessage(null),
    startListening,
    stopListening,
    toggleListening,
  };
}
