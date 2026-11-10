// Web implementation of the voice cache.
// Bundled prompts ship as binary assets; runtime-generated prompts live in localStorage.
import { PREGENERATED_VOICE_ASSETS } from '@/constants/pregenerated-voice-assets';

const STORAGE_PREFIX = 'esmor_voice_cache:';

/**
 * Bundled voice prompts are resolved lazily by Metro; on the web the require
 * call returns a numeric asset id too, resolved through expo-asset under the hood.
 */
export function getBundledVoiceAsset(
  voiceKey: string,
  language: string
): number | null {
  return PREGENERATED_VOICE_ASSETS[`${language}:${voiceKey}`] ?? null;
}

export async function getCachedVoice(
  voiceKey: string,
  language: string
): Promise<string | null> {
  const cacheId = `${language}:${voiceKey}`;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + cacheId);
      if (stored) {
        return stored;
      }
    } catch {
      // localStorage may fail in private mode
    }
  }

  return null;
}

export async function saveCachedVoice(
  voiceKey: string,
  language: string,
  text: string,
  audioBase64: string
): Promise<void> {
  const cacheId = `${language}:${voiceKey}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + cacheId, audioBase64);

      // Keep the cache bounded — drop the oldest keys once it grows past 300 clips.
      const keys = Object.keys(window.localStorage).filter((k) =>
        k.startsWith(STORAGE_PREFIX)
      );
      if (keys.length > 300) {
        keys.slice(0, keys.length - 300).forEach((k) => window.localStorage.removeItem(k));
      }
    } catch {
      // Ignored if storage is full
    }
  }
}

/** Delete every cached voice clip this device holds (used by Reset profile). */
export async function clearVoiceCache(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const keys = Object.keys(window.localStorage).filter((k) =>
      k.startsWith(STORAGE_PREFIX)
    );
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Nothing to clear.
  }
}
