import { getDatabase } from '@/lib/profile-store';
import { PREGENERATED_VOICE_ASSETS } from '@/constants/pregenerated-voice-assets';

/**
 * Bundled voice prompts (pre-generated with Sarvam bulbul) are shipped as binary
 * assets and required on demand, never parsed into the JS heap at startup.
 * This map lets the player resolve "{language}:{voiceKey}" to a Metro asset id.
 */
export function getBundledVoiceAsset(
  voiceKey: string,
  language: string
): number | null {
  return PREGENERATED_VOICE_ASSETS[`${language}:${voiceKey}`] ?? null;
}

/**
 * Runtime-generated voices (Sarvam TTS calls for non-bundled prompts) are
 * cached in SQLite so each phrase is only synthesized and paid for once.
 */
export async function getCachedVoice(
  voiceKey: string,
  language: string
): Promise<string | null> {
  const cacheId = `${language}:${voiceKey}`;

  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ audio_base64: string }>(
      'SELECT audio_base64 FROM voice_cache WHERE id = ?',
      [cacheId]
    );

    if (row?.audio_base64) {
      return row.audio_base64;
    }
  } catch (err) {
    console.warn('Failed to read voice cache from SQLite:', err);
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
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO voice_cache (id, voice_key, language, text, audio_base64, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cacheId, voiceKey, language, text, audioBase64, new Date().toISOString()]
    );
    // Keep the cache bounded — oldest entries are evicted once it grows past 300 clips.
    await db.runAsync(
      `DELETE FROM voice_cache
       WHERE id NOT IN (SELECT id FROM voice_cache ORDER BY created_at DESC LIMIT 300)`
    );
  } catch (err) {
    console.warn('Failed to persist voice into SQLite cache:', err);
  }
}

/** Delete every cached voice clip this device holds (used by Reset profile). */
export async function clearVoiceCache(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM voice_cache');
  } catch (err) {
    console.warn('Could not clear the voice cache:', err);
  }
}
