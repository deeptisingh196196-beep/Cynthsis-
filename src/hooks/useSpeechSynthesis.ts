import { useState, useEffect, useCallback, useRef } from 'react';

// Language detection helper based on scripts and linguistic markers
export function detectLanguageFromText(text: string): { langCode: string; langName: string } {
  if (!text) return { langCode: 'en-US', langName: 'English' };

  // 1. Script checks
  if (/[\u0900-\u097F]/.test(text)) {
    return { langCode: 'hi-IN', langName: 'हिन्दी (Hindi)' };
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    return { langCode: 'bn-IN', langName: 'বাংলা (Bengali)' };
  }
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { langCode: 'ta-IN', langName: 'தமிழ் (Tamil)' };
  }
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { langCode: 'te-IN', langName: 'తెలుగు (Telugu)' };
  }
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return { langCode: 'gu-IN', langName: 'ગુજરાતી (Gujarati)' };
  }
  if (/[\u0A00-\u0A7F]/.test(text)) {
    return { langCode: 'pa-IN', langName: 'ਪੰਜਾਬੀ (Punjabi)' };
  }
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return { langCode: 'kn-IN', langName: 'ಕನ್ನಡ (Kannada)' };
  }
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return { langCode: 'ml-IN', langName: 'മലയാളം (Malayalam)' };
  }
  if (/[\u0600-\u06FF]/.test(text)) {
    return { langCode: 'ar-SA', langName: 'العربية (Arabic)' };
  }
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text) && /[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return { langCode: 'ja-JP', langName: '日本語 (Japanese)' };
  }
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return { langCode: 'zh-CN', langName: '中文 (Chinese)' };
  }
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return { langCode: 'ko-KR', langName: '한국어 (Korean)' };
  }
  if (/[\u0400-\u04FF]/.test(text)) {
    return { langCode: 'ru-RU', langName: 'Русский (Russian)' };
  }

  // 2. Latin-script language heuristics (Spanish, French, German, Italian, Portuguese, Hinglish)
  const lower = text.toLowerCase();

  // Hinglish checks
  if (/\b(kya|kaise|kyun|batao|karo|hota|hote|hoga|nahi|mera|meri|apka|suno|dekho|suraj|pani)\b/i.test(lower)) {
    return { langCode: 'hi-IN', langName: 'Hinglish (हिन्दी)' };
  }
  // Spanish
  if (/\b(el|la|los|las|un|una|es|son|está|están|por|para|cómo|cuál|dónde|gracias|buenos|días|hola)\b/i.test(lower) || /[¿¡ñáéíóú]/.test(lower)) {
    return { langCode: 'es-ES', langName: 'Español (Spanish)' };
  }
  // French
  if (/\b(le|la|les|un|une|est|sont|dans|pour|avec|comment|pourquoi|merci|bonjour|très)\b/i.test(lower) || /[çàèéêëîïôûù]/.test(lower)) {
    return { langCode: 'fr-FR', langName: 'Français (French)' };
  }
  // German
  if (/\b(der|die|das|und|ist|sind|ein|eine|nicht|wie|warum|danke|hallo|guten)\b/i.test(lower) || /[äöüß]/.test(lower)) {
    return { langCode: 'de-DE', langName: 'Deutsch (German)' };
  }
  // Italian
  if (/\b(il|lo|la|i|gli|le|è|sono|un|una|che|per|con|come|perché|grazie|ciao)\b/i.test(lower)) {
    return { langCode: 'it-IT', langName: 'Italiano (Italian)' };
  }
  // Portuguese
  if (/\b(o|a|os|as|um|uma|é|são|que|não|com|para|como|obrigado|olá)\b/i.test(lower) || /[ãõçáéíóú]/.test(lower)) {
    return { langCode: 'pt-BR', langName: 'Português (Portuguese)' };
  }

  return { langCode: 'en-US', langName: 'English' };
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      // Pre-load voices
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, preferredLangCode?: string) => {
      if (!isSupported) return;
      stop();

      // Clean text for speech synthesis
      const cleanText = text
        .replace(/#{1,6}\s?[^\n]*\n+/g, ' ')
        .replace(/(?:Query|Question|User Query|Inquiry)\s*:\s*["']?[^.\n]+["']?[.\n]*/gi, '')
        .replace(/Here is a distilled synthesis[^\n]*/gi, '')
        .replace(/A focused distillation of[^\n]*/gi, '')
        .replace(/Grounded via Wikipedia[^\n]*/gi, '')
        .replace(/To enable live ChatGPT[^\n]*/gi, '')
        .replace(/Tip:\s*Connect your ChatGPT[^\n]*/gi, '')
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[-*+]\s+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Determine target language code
      let targetLang = preferredLangCode;
      if (!targetLang || targetLang === 'auto') {
        const detected = detectLanguageFromText(cleanText);
        targetLang = detected.langCode;
      }

      utterance.lang = targetLang;

      // Pick the best available native voice for this language
      const voices = window.speechSynthesis.getVoices();
      const basePrefix = targetLang.split('-')[0].toLowerCase();

      let matchedVoice: SpeechSynthesisVoice | undefined;

      // 1. Exact match (e.g. es-ES, fr-FR, hi-IN, bn-IN)
      matchedVoice = voices.find((v) => v.lang.toLowerCase() === targetLang?.toLowerCase());

      // 2. Base language prefix match (e.g. 'es', 'fr', 'hi', 'bn', 'de', 'ar', 'ja')
      if (!matchedVoice) {
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(basePrefix) &&
            (v.name.includes('Natural') || v.name.includes('Google') || !v.name.toLowerCase().includes('robot'))
        );
      }

      // 3. Fallback to any voice starting with base prefix
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(basePrefix));
      }

      // 4. Special Indian English fallback for Indic languages if local voice not installed
      if (!matchedVoice && ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'].includes(basePrefix)) {
        matchedVoice = voices.find(
          (v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')
        );
      }

      // 5. Default natural voice
      if (!matchedVoice && voices.length > 0) {
        matchedVoice = voices[0];
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.rate = basePrefix === 'hi' || basePrefix === 'bn' || basePrefix === 'ar' ? 0.95 : 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, stop]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
  };
}
