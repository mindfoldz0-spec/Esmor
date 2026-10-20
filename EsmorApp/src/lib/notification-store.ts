import * as SQLite from 'expo-sqlite';

import type {
  DeviceRegistration,
  NotificationLogEntry,
  NotificationLogKind,
  NotificationPlatform,
} from '@/types/notification';

const DATABASE_NAME = 'esmor-notifications.db';
const DATABASE_VERSION = 1;
const MAX_LOG_ENTRIES = 50;

type RegistrationRow = {
  token: string | null;
  project_id: string | null;
  platform: string;
  registered_at: string;
};

type LogRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  data: string | null;
  created_at: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS device_registration (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        token TEXT,
        project_id TEXT,
        platform TEXT NOT NULL,
        registered_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notification_log (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data TEXT,
        created_at TEXT NOT NULL
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

function openDatabase() {
  return SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
    await migrate(db);
    return db;
  });
}

function getDatabase() {
  databasePromise ??= openDatabase();
  return databasePromise;
}

function isLogKind(value: string): value is NotificationLogKind {
  return value === 'sent' || value === 'received' || value === 'opened' || value === 'error';
}

function isPlatform(value: string): value is NotificationPlatform {
  return value === 'ios' || value === 'android' || value === 'web';
}

function parseData(raw: string | null): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getDeviceRegistration(): Promise<DeviceRegistration | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RegistrationRow>(
    'SELECT * FROM device_registration WHERE id = 1'
  );

  if (!row) {
    return null;
  }

  return {
    token: row.token,
    projectId: row.project_id,
    platform: isPlatform(row.platform) ? row.platform : 'web',
    registeredAt: row.registered_at,
  };
}

export async function saveDeviceRegistration(
  registration: DeviceRegistration
): Promise<DeviceRegistration> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO device_registration (id, token, project_id, platform, registered_at)
     VALUES (1, $token, $projectId, $platform, $registeredAt)
     ON CONFLICT(id) DO UPDATE SET
       token = excluded.token,
       project_id = excluded.project_id,
       platform = excluded.platform,
       registered_at = excluded.registered_at`,
    {
      $token: registration.token,
      $projectId: registration.projectId,
      $platform: registration.platform,
      $registeredAt: registration.registeredAt,
    }
  );

  return registration;
}

export async function getNotificationLog(): Promise<NotificationLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogRow>(
    'SELECT * FROM notification_log ORDER BY created_at DESC LIMIT ?',
    MAX_LOG_ENTRIES
  );

  return rows.map((row) => ({
    id: row.id,
    kind: isLogKind(row.kind) ? row.kind : 'sent',
    title: row.title,
    body: row.body,
    data: parseData(row.data),
    createdAt: row.created_at,
  }));
}

export async function appendNotificationLog(
  entry: NotificationLogEntry
): Promise<NotificationLogEntry[]> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO notification_log (id, kind, title, body, data, created_at)
     VALUES ($id, $kind, $title, $body, $data, $createdAt)
     ON CONFLICT(id) DO UPDATE SET
       kind = excluded.kind,
       title = excluded.title,
       body = excluded.body,
       data = excluded.data,
       created_at = excluded.created_at`,
    {
      $id: entry.id,
      $kind: entry.kind,
      $title: entry.title,
      $body: entry.body,
      $data: entry.data ? JSON.stringify(entry.data) : null,
      $createdAt: entry.createdAt,
    }
  );

  await db.runAsync(
    `DELETE FROM notification_log
     WHERE id NOT IN (
       SELECT id FROM notification_log ORDER BY created_at DESC LIMIT ?
     )`,
    MAX_LOG_ENTRIES
  );

  return getNotificationLog();
}

export async function clearNotificationLog(): Promise<NotificationLogEntry[]> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM notification_log');
  return getNotificationLog();
}

export async function deleteNotificationData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM notification_log');
  await db.runAsync('DELETE FROM device_registration');
}
