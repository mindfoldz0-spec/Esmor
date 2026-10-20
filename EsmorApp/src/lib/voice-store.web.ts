// Web implementation of voice cache using localStorage with bundled fallback
const pregeneratedVoices: Record<string, { key: string; language: string; text: string; audioBase64: string }> =
  require('@/constants/pregenerated-voices.json');

const STORAGE_PREFIX = 'esmor_voice_cache:';

export async function ensureVoiceCacheSeeded(): Promise<void> {
  // On web, pregeneratedVoices is directly available in memory.
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

  if (pregeneratedVoices[cacheId]?.audioBase64) {
    return pregeneratedVoices[cacheId].audioBase64;
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
    } catch {
      // Ignored if storage is full
    }
  }
}
