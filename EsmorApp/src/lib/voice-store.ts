import { getDatabase } from '@/lib/profile-store';

let isSeeded = false;

// Bundled pre-generated voice recordings generated using Sarvam bulbul:v4-flash
// This eliminates API latency and runtime API cost for standard pages.
const pregeneratedVoices: Record<string, { key: string; language: string; text: string; audioBase64: string }> =
  require('@/constants/pregenerated-voices.json');

export async function ensureVoiceCacheSeeded(): Promise<void> {
  if (isSeeded) return;

  try {
    const db = await getDatabase();
    const countRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM voice_cache'
    );

    const existingCount = countRow?.count ?? 0;
    if (existingCount < Object.keys(pregeneratedVoices).length) {
      await db.withTransactionAsync(async () => {
        for (const [id, entry] of Object.entries(pregeneratedVoices)) {
          await db.runAsync(
            `INSERT OR IGNORE INTO voice_cache (id, voice_key, language, text, audio_base64, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              entry.key,
              entry.language,
              entry.text,
              entry.audioBase64,
              new Date().toISOString(),
            ]
          );
        }
      });
    }

    isSeeded = true;
  } catch (err) {
    console.warn('Could not seed voice cache into SQLite:', err);
  }
}

export async function getCachedVoice(
  voiceKey: string,
  language: string
): Promise<string | null> {
  const cacheId = `${language}:${voiceKey}`;

  // 1. Check in SQLite database first
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

  // 2. Direct memory fallback from pregenerated voices
  if (pregeneratedVoices[cacheId]?.audioBase64) {
    const base64 = pregeneratedVoices[cacheId].audioBase64;
    // Persist into SQLite asynchronously
    saveCachedVoice(
      voiceKey,
      language,
      pregeneratedVoices[cacheId].text,
      base64
    ).catch(() => {});
    return base64;
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
  } catch (err) {
    console.warn('Failed to persist voice into SQLite cache:', err);
  }
}
