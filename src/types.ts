export interface WikipediaGrounding {
  title: string;
  extract: string;
  url: string;
  description?: string;
  thumbnail?: string;
  authenticatedWithKey?: boolean;
}

export interface AttachedMedia {
  id: string;
  type: 'camera' | 'gallery' | 'photo' | 'video';
  url: string;
  name: string;
  thumbnailUrl?: string;
  timestamp: number;
}

export interface SynthesisResult {
  query: string;
  synthesis: string;
  source?: 'cynthsis' | 'gemini' | 'local' | 'fallback';
  modelName?: string;
  language?: string;
  langCode?: string;
  wikipedia?: WikipediaGrounding | null;
  attachments?: AttachedMedia[];
  timestamp: number;
}

export interface PhotoItem {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  style: string;
  aspectRatio: '1:1' | '16:9' | '9:16';
  timestamp: number;
}

export interface VideoItem {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  keyframes?: string[];
  motion: string;
  style: string;
  aspectRatio: '16:9' | '9:16';
  duration: number;
  timestamp: number;
}

export type AppMode = 'chat' | 'photo' | 'video';

export interface ChatTurn {
  id: string;
  query: string;
  attachments?: AttachedMedia[];
  result?: SynthesisResult | null;
  isLoading?: boolean;
  timestamp: number;
}

export type MicState = 'idle' | 'requesting' | 'listening' | 'error' | 'unsupported';
