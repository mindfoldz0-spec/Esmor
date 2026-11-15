import { getBundledVoiceAsset, getCachedVoice, saveCachedVoice } from '@/lib/voice-store';
import { fetchWithTimeout } from '@/lib/net';
import type { Language } from '@/i18n/languages';
import type { VoicePromptKey } from '@/types/voice';

const LANGUAGE_CODE_MAP: Record<Language, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN',
};

/** Deterministic short hash of arbitrary text (djb2), used for voice cache keys. */
export function hashPromptText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Build a stable cache key for a dynamic prompt: identical text reuses the
 * cache, changed text generates a new entry instead of replaying stale audio.
 */
export function contentVoiceKey(base: string, text: string): string {
  return `${base}:${hashPromptText(text)}`;
}

export type VoiceSource =
  /** Pre-generated prompt, shipped as a binary asset. Plays instantly, works offline. */
  | { kind: 'asset'; asset: number }
  /** Runtime-generated audio from SQLite/localStorage or freshly synthesized. */
  | { kind: 'base64'; audio: string };

function getApiKey(): string | null {
  return (
    process.env.EXPO_PUBLIC_SARVAM_API_KEY ||
    process.env.sarvam_api ||
    null
  );
}

/**
 * Resolve the audio for a prompt and language.
 *
 * 1. Bundled asset (pre-generated, zero network, zero cost).
 * 2. SQLite / localStorage cache of previous Sarvam TTS generations.
 * 3. Sarvam TTS (bulbul:v4-flash), cached for future plays.
 */
export async function getVoiceSource(
  voiceKey: VoicePromptKey | string,
  language: Language,
  fallbackText?: string
): Promise<VoiceSource | null> {
  const key = String(voiceKey);

  // 1. Try the bundled asset map first (no JS heap parse, no network)
  const asset = getBundledVoiceAsset(key, language);
  if (asset !== null) {
    return { kind: 'asset', asset };
  }

  // 2. Try the runtime cache (audio generated on a previous run)
  const cached = await getCachedVoice(key, language);
  if (cached) {
    return { kind: 'base64', audio: cached };
  }

  // 3. Generate on demand if text is available to synthesize
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
    const response = await fetchWithTimeout(
      'https://api.sarvam.ai/text-to-speech',
      {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fallbackText,
          target_language_code: langCode,
          model: 'bulbul:v4-flash',
        }),
      },
      10000
    );

    if (!response.ok) {
      console.warn(`Sarvam TTS error: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const base64Audio = data?.audios?.[0];

    if (base64Audio) {
      // Cache so we never pay or call the API for it again.
      await saveCachedVoice(key, language, fallbackText, base64Audio);
      return { kind: 'base64', audio: base64Audio };
    }
  } catch (err) {
    console.warn('Could not fetch voice from Sarvam API:', err);
  }

  return null;
}
