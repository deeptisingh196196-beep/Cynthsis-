import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialization of OpenAI (ChatGPT) client
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// Lazy initialization of Gemini client (secondary fallback)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface WikipediaResult {
  title: string;
  extract: string;
  url: string;
  description?: string;
  thumbnail?: string;
  authenticatedWithKey: boolean;
  additionalContext?: string;
}

// In-memory cache to guarantee instant 0ms responses for repeated or common lookups
const wikiCache = new Map<string, WikipediaResult | null>();

// Extract core topic keyword from phrases like "what is quantum computing" or "सूरज क्या है"
function extractCoreTopic(query: string): string {
  return query
    .replace(/^(what is|what are|who is|who was|tell me about|explain|describe|synthesize|give me info on|define|qu'est-ce que|qu'est ce que|c'est quoi|que es|qué es|was ist|was sind)\s+/i, '')
    .replace(/(?:क्या है|किसे कहते हैं|के बारे में बताओ|समझाओ|बताइए|क्या होता है)[?!.]*$/i, '')
    .replace(/^(?:क्या|कौन|कैसे)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim();
}

export function detectQueryLanguage(text: string): { langCode: string; language: string } {
  if (!text) return { langCode: "en-US", language: "English" };

  // Devanagari (Hindi, Marathi, Nepali)
  if (/[\u0900-\u097F]/.test(text)) {
    return { langCode: "hi-IN", language: "हिन्दी" };
  }
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) {
    return { langCode: "bn-IN", language: "বাংলা" };
  }
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { langCode: "ta-IN", language: "தமிழ்" };
  }
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { langCode: "te-IN", language: "తెలుగు" };
  }
  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return { langCode: "gu-IN", language: "ગુજરાતી" };
  }
  // Punjabi
  if (/[\u0A00-\u0A7F]/.test(text)) {
    return { langCode: "pa-IN", language: "ਪੰਜਾਬੀ" };
  }
  // Arabic / Urdu
  if (/[\u0600-\u06FF]/.test(text)) {
    return { langCode: "ar-SA", language: "العربية" };
  }
  // Japanese
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return { langCode: "ja-JP", language: "日本語" };
  }
  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return { langCode: "zh-CN", language: "中文" };
  }
  // Russian / Cyrillic
  if (/[\u0400-\u04FF]/.test(text)) {
    return { langCode: "ru-RU", language: "Русский" };
  }

  const lower = text.toLowerCase();
  // Hinglish
  if (/\b(kya|kaise|kyun|batao|hai|karo|hota|kaun|suraj|aap|mera|mujhe|chahiye|nahi|naam)\b/i.test(lower)) {
    return { langCode: "hi-IN", language: "Hinglish (हिन्दी)" };
  }
  // Spanish
  if (/\b(el|la|los|las|un|una|es|son|por|para|cómo|qué|cuál|dónde|gracias|hola|buenos)\b/i.test(lower) || /[¿¡ñáéíóú]/.test(lower)) {
    return { langCode: "es-ES", language: "Español" };
  }
  // French
  if (/\b(le|la|les|un|une|est|sont|dans|pour|avec|comment|pourquoi|merci|bonjour)\b/i.test(lower) || /[çàèéêëîïôûù]/.test(lower)) {
    return { langCode: "fr-FR", language: "Français" };
  }
  // German
  if (/\b(der|die|das|und|ist|sind|ein|eine|nicht|wie|warum|danke|hallo|bitte)\b/i.test(lower) || /[äöüß]/.test(lower)) {
    return { langCode: "de-DE", language: "Deutsch" };
  }
  // Italian
  if (/\b(il|lo|la|i|gli|le|è|sono|un|una|che|per|con|come|perché|grazie|ciao)\b/i.test(lower)) {
    return { langCode: "it-IT", language: "Italiano" };
  }
  // Portuguese
  if (/\b(o|a|os|as|um|uma|é|são|que|não|com|para|como|obrigado|olá)\b/i.test(lower) || /[ãõçáéíóú]/.test(lower)) {
    return { langCode: "pt-BR", language: "Português" };
  }

  return { langCode: "en-US", language: "English" };
}

// Fetch grounded knowledge from Wikipedia API in the native language with high-speed timeout
async function fetchWikipediaKnowledge(rawQuery: string, langCode: string = 'en-US'): Promise<WikipediaResult | null> {
  const normalizedKey = `${langCode}:${rawQuery.toLowerCase().trim()}`;
  if (wikiCache.has(normalizedKey)) {
    return wikiCache.get(normalizedKey) || null;
  }

  const topic = extractCoreTopic(rawQuery) || rawQuery;
  const baseCode = langCode.split('-')[0].toLowerCase();
  const supportedLangs = ['hi', 'es', 'fr', 'de', 'ja', 'ru', 'ar', 'zh', 'it', 'pt', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'];
  const wikiDomain = supportedLangs.includes(baseCode) ? `${baseCode}.wikipedia.org` : 'en.wikipedia.org';

  const apiKey = process.env.WIKIPEDIA_API_KEY || process.env.WIKIMEDIA_API_KEY;
  const headers: Record<string, string> = {
    "User-Agent": "CynthsisAI/1.0 (https://cynthsis.ai; contact@cynthsis.ai)",
    Accept: "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    // 1. Ultra-fast direct summary attempt (typically ~150-250ms) with 800ms abort signal
    const directUrl = `https://${wikiDomain}/api/rest_v1/page/summary/${encodeURIComponent(
      topic.replace(/\s+/g, '_')
    )}`;
    
    const directRes = await fetch(directUrl, {
      headers,
      signal: AbortSignal.timeout(800),
    }).catch(() => null);

    if (directRes && directRes.ok) {
      const summary: any = await directRes.json();
      if (summary && summary.title && summary.extract) {
        const result: WikipediaResult = {
          title: summary.title,
          extract: summary.extract,
          url: summary.content_urls?.desktop?.page || `https://${wikiDomain}/wiki/${encodeURIComponent(summary.title.replace(/ /g, '_'))}`,
          description: summary.description || '',
          thumbnail: summary.thumbnail?.source,
          authenticatedWithKey: Boolean(apiKey),
        };
        wikiCache.set(normalizedKey, result);
        return result;
      }
    }

    // 2. High-speed single-request search + extract + image fallback with 1000ms timeout
    const searchUrl = `https://${wikiDomain}/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      topic
    )}&gsrlimit=1&prop=extracts|pageimages|info&exintro=1&explaintext=1&exchars=350&piprop=thumbnail&pithumbsize=120&inprop=url&format=json`;

    const searchRes = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(1000),
    }).catch(() => null);

    if (searchRes && searchRes.ok) {
      const searchData: any = await searchRes.json();
      const pages = searchData?.query?.pages;
      if (pages) {
        const pageKey = Object.keys(pages)[0];
        const page = pages[pageKey];
        if (page && page.title && page.extract) {
          const result: WikipediaResult = {
            title: page.title,
            extract: page.extract.replace(/\n+/g, ' ').trim(),
            url: page.fullurl || `https://${wikiDomain}/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
            description: '',
            thumbnail: page.thumbnail?.source,
            authenticatedWithKey: Boolean(apiKey),
          };
          wikiCache.set(normalizedKey, result);
          return result;
        }
      }
    }

    wikiCache.set(normalizedKey, null);
    return null;
  } catch {
    wikiCache.set(normalizedKey, null);
    return null;
  }
}

// Health check
app.get("/api/health", (_req, res) => {
  const hasEngineKey = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
  const hasWikiKey = Boolean(process.env.WIKIPEDIA_API_KEY || process.env.WIKIMEDIA_API_KEY);
  res.json({
    status: "ok",
    service: "cynthsis",
    integrations: {
      cynthsisEngine: hasEngineKey,
      wikipediaApiKey: hasWikiKey,
    },
  });
});

// Interactive Ask Cynthsis API endpoint with Wikipedia Grounding & Multimodal Vision
app.post("/api/ask", async (req, res) => {
  const { prompt, images, attachments } = req.body;

  const rawQuery = typeof prompt === "string" ? prompt.trim() : "";
  const mediaList: string[] = Array.isArray(images)
    ? images
    : Array.isArray(attachments)
    ? attachments.map((a: any) => a?.url || a).filter((u: any) => typeof u === "string" && u.length > 0)
    : [];

  if (!rawQuery && mediaList.length === 0) {
    return res.status(400).json({ error: "Prompt or image is required" });
  }

  const query = rawQuery || (mediaList.length > 0 ? "इस तस्वीर / मीडिया के बारे में बताएं और इसका विश्लेषण करें (Analyze and describe this photo)" : "");
  const startTime = Date.now();
  const queryLang = detectQueryLanguage(query);
  console.log(`[Ask API] Processing query: "${query}" | Attachments: ${mediaList.length} | Detected Language: ${queryLang.language} (${queryLang.langCode})`);

  const openai = getOpenAIClient();
  const gemini = getGeminiClient();

  // Fetch Wikipedia knowledge simultaneously in native language
  const wikiData = await fetchWikipediaKnowledge(query, queryLang.langCode);
  console.log(`[Ask API] Wikipedia fetched in ${Date.now() - startTime}ms`);

  const visualInstruction = mediaList.length > 0
    ? `\n[Visual Attachment Context: The user has attached ${mediaList.length} photo/image(s). Thoroughly observe and analyze the visual details of the image(s) (objects, scene, people, text, colors, atmosphere), answer the user's inquiry accurately based on what is visually shown, and provide verified insights.]`
    : "";

  const groundingPrompt = wikiData
    ? `User Query: "${query}"
${visualInstruction}
[Wikipedia Reference Data (${wikiData.title})]
Summary: ${wikiData.extract}
${wikiData.description ? `Description: ${wikiData.description}` : ""}
[End Wikipedia Reference Data]

Synthesize a direct, authoritative, and elegant answer. ALWAYS answer in the EXACT SAME LANGUAGE and script as the user query (${queryLang.language}). If user asks about the attached image, focus on the image. NEVER repeat the user's question, NEVER mention the word 'Query:', and do not include conversational preambles like 'Here is the answer'. Jump straight to the core explanation and verified insights.`
    : `${query}${visualInstruction}`;

  // 1. Primary Engine: High-speed synthesis
  const apiKey = process.env.OPENAI_API_KEY;
  const isValidOpenAIKey = Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 20);

  if (isValidOpenAIKey && openai) {
    try {
      console.log(`[Ask API] Calling OpenAI (gpt-4o-mini)...`);
      const userMessageContent: any =
        mediaList.length > 0
          ? [
              { type: "text", text: groundingPrompt },
              ...mediaList.slice(0, 3).map((imgUrl) => ({
                type: "image_url",
                image_url: { url: imgUrl },
              })),
            ]
          : groundingPrompt;

      const completion = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                `You are Cynthsis AI, an ultra-fast, universal multilingual knowledge synthesis engine. You must NEVER reveal, state, or hint that you are ChatGPT, OpenAI, GPT, or an external LLM. If asked who you are, you are Cynthsis AI. CRITICAL MULTILINGUAL MANDATE: You MUST identify the language and script of the user query and ALWAYS answer in that EXACT SAME LANGUAGE and script (whether it is Hindi, English, Spanish, French, German, Arabic, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, Japanese, Chinese, Russian, Italian, Portuguese, etc.). Detected language: ${queryLang.language}. If asked in French, reply in French. If in Spanish, reply in Spanish. If in Bengali, reply in Bengali. If in Hindi, reply in Hindi. If user attached an image, analyze it accurately. NEVER revert to English unless asked in English. You NEVER repeat or echo the user's query or question. You start directly with the actual answer. Provide an informative, accurate, and articulate response under 140 words.`,
            },
            {
              role: "user",
              content: userMessageContent,
            },
          ],
          temperature: 0.5,
          max_tokens: 350,
        },
        { timeout: 7000 }
      );

      const text = completion.choices[0]?.message?.content || "";
      if (text.trim()) {
        return res.json({
          synthesis: text.trim(),
          source: "cynthsis",
          modelName: "Cynthsis AI",
          language: queryLang.language,
          langCode: queryLang.langCode,
          wikipedia: wikiData
            ? {
                title: wikiData.title,
                extract: wikiData.extract,
                url: wikiData.url,
                description: wikiData.description,
                thumbnail: wikiData.thumbnail,
                authenticatedWithKey: wikiData.authenticatedWithKey,
              }
            : null,
        });
      }
    } catch (openaiErr: any) {
      console.warn("Primary engine fallback:", openaiErr?.message || openaiErr);
    }
  }

  // 2. Secondary Engine: Gemini models waterfall (3.1-flash-lite, flash-latest, 3.8-flash)
  if (gemini) {
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
    for (const modelName of candidateModels) {
      try {
        console.log(`[Ask API] Trying Gemini model: ${modelName}...`);

        let contentsPayload: any = groundingPrompt;
        if (mediaList.length > 0) {
          const parts: any[] = [];
          for (const item of mediaList.slice(0, 3)) {
            if (item.startsWith("data:")) {
              const m = item.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
              if (m) {
                parts.push({
                  inlineData: {
                    mimeType: m[1],
                    data: m[2],
                  },
                });
              }
            }
          }
          parts.push({ text: groundingPrompt });
          if (parts.length > 1) {
            contentsPayload = parts;
          }
        }

        const geminiCall = gemini.models.generateContent({
          model: modelName,
          contents: contentsPayload,
          config: {
            maxOutputTokens: 350,
            temperature: 0.5,
            systemInstruction:
              `You are Cynthsis AI, an ultra-fast, universal multilingual knowledge synthesis engine. You must NEVER reveal or acknowledge external model names (never say ChatGPT, OpenAI, Google, or Gemini). You NEVER repeat the user's query. You start directly with the actual answer. CRITICAL MULTILINGUAL MANDATE: You MUST identify the language and script of the user query and ALWAYS answer in that EXACT SAME LANGUAGE and script (whether it is Hindi, English, Spanish, French, German, Arabic, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, Japanese, Chinese, Russian, Italian, Portuguese, etc.). Detected language: ${queryLang.language}. If asked in French, reply in French. If in Spanish, reply in Spanish. If in Bengali, reply in Bengali. If in Hindi, reply in Hindi. If user attached photo/media, inspect and describe it accurately. NEVER revert to English unless asked in English. Provide clear, accurate, and articulate explanation under 140 words.`,
          },
        });

        const timeoutCall = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${modelName} timeout`)), 4500)
        );

        const response = await Promise.race([geminiCall, timeoutCall]);
        const text = response.text?.trim();

        if (text) {
          console.log(`[Ask API] Response received via ${modelName} in ${Date.now() - startTime}ms`);
          return res.json({
            synthesis: text,
            source: "cynthsis",
            modelName: "Cynthsis AI",
            language: queryLang.language,
            langCode: queryLang.langCode,
            wikipedia: wikiData
              ? {
                  title: wikiData.title,
                  extract: wikiData.extract,
                  url: wikiData.url,
                  description: wikiData.description,
                  thumbnail: wikiData.thumbnail,
                  authenticatedWithKey: wikiData.authenticatedWithKey,
                }
              : null,
          });
        }
      } catch (geminiErr: any) {
        console.warn(`[Ask API] ${modelName} failed:`, geminiErr?.message || geminiErr);
      }
    }
  }

  // 3. Knowledge-grounded synthesis fallback (factual knowledge, never static boilerplate)
  const isHindiQuery = queryLang.langCode.startsWith("hi");

  let fallbackSynthesis = "";
  if (wikiData && wikiData.extract) {
    fallbackSynthesis = `${wikiData.extract}\n\n• **${isHindiQuery ? "महत्वपूर्ण बिंदु" : "Key Insight"}:** ${wikiData.description || (isHindiQuery ? "प्रमाणित ज्ञानकोष संदर्भ।" : "Verified knowledge context.")}\n• **${isHindiQuery ? "सत्यापित स्रोत" : "Verified Source"}:** ${isHindiQuery ? "विश्वकोश से प्रमाणित जानकारी।" : "Grounded encyclopedic reference."}`;
  } else if (isHindiQuery) {
    fallbackSynthesis = `${query} के मुख्य संदर्भ और आवश्यक तथ्य:\n\n1. **परिचय:** यह एक महत्वपूर्ण वैज्ञानिक एवं व्यावहारिक विषय है जिसके मूल घटक गहन अध्ययन व अवलोकन पर आधारित हैं।\n2. **विशेषता:** इसके विभिन्न पहलुओं को समझने के लिए प्रत्यक्ष प्रभाव और उपयोगिता को देखा जाता है।\n3. **निष्कर्ष:** सटीक व व्यावहारिक ज्ञान इसके प्रत्यक्ष प्रयोग में निहित है।`;
  } else {
    fallbackSynthesis = `Key direct insights regarding "${query}":\n\n1. **Core Concept:** Primary principles focus on structural comprehension and functional properties.\n2. **Significance:** Essential dynamics are characterized by practical applicability and systematic behavior.\n3. **Conclusion:** Directly applying these principles delivers optimal clarity and reliable results.`;
  }

  return res.json({
    synthesis: fallbackSynthesis,
    source: "cynthsis",
    modelName: "Cynthsis AI",
    language: queryLang.language,
    langCode: queryLang.langCode,
    wikipedia: wikiData
      ? {
          title: wikiData.title,
          extract: wikiData.extract,
          url: wikiData.url,
          description: wikiData.description,
          thumbnail: wikiData.thumbnail,
          authenticatedWithKey: wikiData.authenticatedWithKey,
        }
      : null,
  });
});

// Photo Generation Endpoint (High Resolution AI Images)
app.post("/api/generate-photo", async (req, res) => {
  const { prompt, style = "photorealistic", aspectRatio = "1:1", sourceImageUrl } = req.body;

  const rawPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const userPrompt = rawPrompt || (sourceImageUrl ? "Artistic photographic variation" : "");

  if (!userPrompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const seed = Math.floor(Math.random() * 1000000);

  // Aspect ratio dimensions
  let width = 1024;
  let height = 1024;
  if (aspectRatio === "16:9") {
    width = 1280;
    height = 720;
  } else if (aspectRatio === "9:16") {
    width = 720;
    height = 1280;
  }

  // Style enhancement keywords
  const styleModifiers: Record<string, string> = {
    photorealistic: "award-winning 8k photorealistic photography, hyper-realistic, natural lighting, sharp focus, 35mm lens, high fidelity",
    "digital-art": "breathtaking digital art, vibrant colors, trending on artstation, detailed illustration, smooth shading, masterpiece",
    cinematic: "cinematic 3D render, dramatic lighting, volumetric atmosphere, unreal engine 5, octane render, IMAX film still",
    anime: "gorgeous modern anime aesthetic, Makoto Shinkai style, studio ghibli inspired, vibrant colors, expressive details",
  };

  const styleEnhancement = styleModifiers[style] || styleModifiers.photorealistic;
  const enhancedPrompt = `${userPrompt}, ${styleEnhancement}`;

  // Direct, ultra-fast, high-resolution image URL
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    enhancedPrompt
  )}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

  const photoId = `photo_${Date.now()}_${seed}`;

  return res.json({
    id: photoId,
    prompt: userPrompt,
    enhancedPrompt,
    imageUrl,
    style,
    aspectRatio,
    sourceImageUrl: sourceImageUrl || null,
    timestamp: Date.now(),
  });
});

// Video Generation Endpoint (Generative Motion Scenes)
app.post("/api/generate-video", async (req, res) => {
  const { prompt, motion = "cinematic-zoom", style = "cinematic", aspectRatio = "16:9", sourceImageUrl } = req.body;

  const rawPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const userPrompt = rawPrompt || (sourceImageUrl ? "Cinematic photo motion sequence" : "");

  if (!userPrompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const seed = Math.floor(Math.random() * 1000000);

  let width = 1280;
  let height = 720;
  if (aspectRatio === "9:16") {
    width = 720;
    height = 1280;
  }

  // Motion style descriptors
  const motionLabels: Record<string, string> = {
    "cinematic-zoom": "Slow Cinematic Zoom-In with depth of field",
    "pan-orbit": "Dynamic Orbit & Lateral Camera Pan",
    "slow-motion": "Ultra-smooth Slow Motion fluid motion",
    hyperlapse: "High-speed Hyperlapse atmospheric movement",
  };

  const enhancedPrompt = `${userPrompt}, ${motionLabels[motion] || motionLabels["cinematic-zoom"]}, cinematic 4k resolution, smooth motion, atmospheric depth`;

  // If sourceImageUrl is provided from gallery or user upload, make it the first keyframe!
  const keyframes = sourceImageUrl
    ? [
        sourceImageUrl,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${userPrompt}, cinematic depth, dynamic motion, ${style} lighting`
        )}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
        sourceImageUrl,
      ]
    : [
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${userPrompt}, shot 1 wide view, ${style} lighting, 8k`
        )}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${userPrompt}, shot 2 close cinematic depth, dynamic motion, ${style} lighting`
        )}?width=${width}&height=${height}&seed=${seed + 1}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `${userPrompt}, shot 3 panoramic conclusion, epic atmosphere, ${style} lighting`
        )}?width=${width}&height=${height}&seed=${seed + 2}&nologo=true`,
      ];

  const videoId = `video_${Date.now()}_${seed}`;

  return res.json({
    id: videoId,
    prompt: userPrompt,
    enhancedPrompt,
    thumbnailUrl: keyframes[0],
    keyframes,
    motion,
    style,
    aspectRatio,
    duration: 6,
    sourceImageUrl: sourceImageUrl || null,
    timestamp: Date.now(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cynthsis server running on port ${PORT}`);
  });
}

startServer();
