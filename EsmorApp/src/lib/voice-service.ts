import { ensureVoiceCacheSeeded, getCachedVoice, saveCachedVoice } from '@/lib/voice-store';
import type { Language } from '@/i18n/languages';
import type { VoicePromptKey } from '@/types/voice';

const LANGUAGE_CODE_MAP: Record<Language, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN',
};

// Initialize SQLite table & seed in background
ensureVoiceCacheSeeded().catch(() => {});

function getApiKey(): string | null {
  return (
    process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
    process.env.sarvam_api ||
    null
  );
}

/**
 * Fetch or retrieve cached voice audio base64 for a prompt and language.
 *
 * 1. Checks SQLite / local store (zero network, instant, pre-generated).
 * 2. If not found and fallbackText is provided, calls Sarvam TTS (bulbul:v4-flash)
 *    and caches the audio in SQLite for future plays.
 */
export async function getVoiceAudio(
  voiceKey: VoicePromptKey | string,
  language: Language,
  fallbackText?: string
): Promise<string | null> {
  // 1. Try SQLite / local cache
  const cached = await getCachedVoice(voiceKey, language);
  if (cached) {
    return cached;
  }

  // 2. If not found and no text provided to generate, return null
  if (!fallbackText || !fallbackText.trim()) {
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Sarvam API key is not configured.');
    return null;
  }

  const langCode = LANGUAGE_CODE_MAP[language] ?? 'hi-IN';

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: fallbackText,
        language_code: langCode,
        model: 'bulbul:v4-flash',
      }),
    });

    if (!response.ok) {
      console.warn(`Sarvam TTS error: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const base64Audio = data?.audios?.[0];

    if (base64Audio) {
      // Save in SQLite cache so we never pay or call API for it again!
      await saveCachedVoice(voiceKey, language, fallbackText, base64Audio);
      return base64Audio;
    }
  } catch (err) {
    console.warn('Could not fetch voice from Sarvam API:', err);
  }

  return null;
}
