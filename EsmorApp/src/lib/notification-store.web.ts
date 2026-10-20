import type {
  DeviceRegistration,
  NotificationLogEntry,
  NotificationLogKind,
  NotificationPlatform,
} from '@/types/notification';

/**
 * SQLite needs WASM and cross-origin isolation on the web, so the browser
 * build keeps the notification data in localStorage instead.
 */
const STORAGE_KEY = 'esmor.notifications.v1';
const MAX_LOG_ENTRIES = 50;

type StoredState = {
  registration: DeviceRegistration | null;
  log: NotificationLogEntry[];
};

function readState(): StoredState {
  if (typeof window === 'undefined') {
    return { registration: null, log: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { registration: null, log: [] };
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const log = Array.isArray(parsed.log) ? parsed.log : [];

    return {
      registration: parsed.registration ?? null,
      log: log.filter(
        (entry): entry is NotificationLogEntry =>
          typeof entry?.id === 'string' &&
          typeof entry?.createdAt === 'string' &&
          typeof entry?.kind === 'string' &&
          isLogKind(entry.kind)
      ),
    };
  } catch {
    return { registration: null, log: [] };
  }
}

function writeState(state: StoredState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isLogKind(value: string): value is NotificationLogKind {
  return value === 'sent' || value === 'received' || value === 'opened' || value === 'error';
}

function isPlatform(value: string): value is NotificationPlatform {
  return value === 'ios' || value === 'android' || value === 'web';
}

export async function getDeviceRegistration(): Promise<DeviceRegistration | null> {
  const registration = readState().registration;

  if (!registration) {
    return null;
  }

  return {
    token: registration.token,
    projectId: registration.projectId,
    platform: isPlatform(registration.platform) ? registration.platform : 'web',
    registeredAt: registration.registeredAt,
  };
}

export async function saveDeviceRegistration(
  registration: DeviceRegistration
): Promise<DeviceRegistration> {
  const state = readState();
  writeState({ ...state, registration });
  return registration;
}

export async function getNotificationLog(): Promise<NotificationLogEntry[]> {
  return readState().log;
}

export async function appendNotificationLog(
  entry: NotificationLogEntry
): Promise<NotificationLogEntry[]> {
  const state = readState();
  const log = [entry, ...state.log]
    .slice(0, MAX_LOG_ENTRIES)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  writeState({ ...state, log });
  return log;
}

export async function clearNotificationLog(): Promise<NotificationLogEntry[]> {
  const state = readState();
  writeState({ ...state, log: [] });
  return [];
}

export async function deleteNotificationData(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
