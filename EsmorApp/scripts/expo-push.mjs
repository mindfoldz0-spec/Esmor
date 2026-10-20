import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptDir, '..');

export const TOKENS_FILE = path.join(projectRoot, 'push-tokens.json');
export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
export const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

/** Expo accepts at most 100 messages per request. */
const MAX_BATCH_SIZE = 100;

export function chunk(items, size = MAX_BATCH_SIZE) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function readTokens(file = TOKENS_FILE) {
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => entry && typeof entry.token === 'string');
    }

    if (Array.isArray(parsed?.tokens)) {
      return parsed.tokens.filter(
        (entry) => entry && typeof entry.token === 'string'
      );
    }

    return [];
  } catch {
    return [];
  }
}

export async function writeTokens(tokens, file = TOKENS_FILE) {
  await writeFile(file, `${JSON.stringify(tokens, null, 2)}\n`, 'utf8');
}

export function upsertToken(tokens, entry) {
  const existingIndex = tokens.findIndex(
    (token) => token.token === entry.token
  );

  if (existingIndex >= 0) {
    tokens[existingIndex] = { ...tokens[existingIndex], ...entry };
    return tokens;
  }

  tokens.push(entry);
  return tokens;
}

/**
 * Sends messages to the Expo Push Service and returns the push tickets.
 * The payload follows https://docs.expo.dev/push-notifications/sending-notifications/
 */
export async function sendMessages(messages, { accessToken } = {}) {
  if (!messages.length) {
    return { data: [] };
  }

  const headers = { 'Content-Type': 'application/json' };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.errors?.map((error) => error.message).join(', ') ||
      `Expo push service responded with ${response.status}`;

    throw new Error(message);
  }

  return payload;
}

/** Builds one Expo push message per device token. */
export function buildMessages(tokens, notification) {
  return tokens.map((entry) => {
    const message = {
      to: entry.token,
      title: notification.title,
      body: notification.body,
    };

    if (notification.subtitle) {
      message.subtitle = notification.subtitle;
    }

    if (notification.data && Object.keys(notification.data).length > 0) {
      message.data = notification.data;
    }

    if (notification.channelId) {
      message.channelId = notification.channelId;
    }

    if (typeof notification.badge === 'number') {
      message.badge = notification.badge;
    }

    if (notification.sound) {
      message.sound = notification.sound;
    }

    if (typeof notification.ttl === 'number') {
      message.ttl = notification.ttl;
    }

    if (notification.priority) {
      message.priority = notification.priority;
    }

    return message;
  });
}
