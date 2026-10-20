import * as SQLite from 'expo-sqlite';

import { DEFAULT_LANGUAGE, isLanguage, type Language } from '@/i18n/languages';
import {
  isGender,
  isLocationSource,
  isUserRole,
  type NewProfile,
  type Profile,
} from '@/types/profile';

const DATABASE_NAME = 'esmor.db';
const DATABASE_VERSION = 2;

type ProfileRow = {
  name: string;
  age: number;
  phone: string;
  gender: string;
  role?: string | null;
  language: string;
  location_label: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_accuracy: number | null;
  location_source: string | null;
  created_at: string;
  updated_at: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        phone TEXT NOT NULL,
        gender TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'farmer',
        language TEXT NOT NULL,
        location_label TEXT,
        location_latitude REAL,
        location_longitude REAL,
        location_accuracy REAL,
        location_source TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  } else if (currentVersion < 2) {
    try {
      await db.execAsync("ALTER TABLE profile ADD COLUMN role TEXT DEFAULT 'farmer'");
    } catch {
      // Column might already exist
    }
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

function mapProfile(row: ProfileRow): Profile {
  const language: Language = isLanguage(row.language) ? row.language : DEFAULT_LANGUAGE;
  const locationSource = isLocationSource(row.location_source)
    ? row.location_source
    : 'gps';

  return {
    name: row.name,
    age: row.age,
    phone: row.phone,
    gender: isGender(row.gender) ? row.gender : 'female',
    role: isUserRole(row.role) ? row.role : 'farmer',
    language,
    location: {
      label: row.location_label,
      latitude: row.location_latitude,
      longitude: row.location_longitude,
      accuracy: row.location_accuracy,
      source: locationSource,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfile(): Promise<Profile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1');
  return row ? mapProfile(row) : null;
}

export async function saveProfile(input: NewProfile): Promise<Profile> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO profile (
      id, name, age, phone, gender, role, language,
      location_label, location_latitude, location_longitude, location_accuracy,
      location_source, created_at, updated_at
    ) VALUES (
      1, $name, $age, $phone, $gender, $role, $language,
      $locationLabel, $latitude, $longitude, $accuracy,
      $locationSource, $createdAt, $updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      age = excluded.age,
      phone = excluded.phone,
      gender = excluded.gender,
      role = excluded.role,
      language = excluded.language,
      location_label = excluded.location_label,
      location_latitude = excluded.location_latitude,
      location_longitude = excluded.location_longitude,
      location_accuracy = excluded.location_accuracy,
      location_source = excluded.location_source,
      updated_at = excluded.updated_at`,
    {
      $name: input.name,
      $age: input.age,
      $phone: input.phone,
      $gender: input.gender,
      $role: input.role,
      $language: input.language,
      $locationLabel: input.location.label,
      $latitude: input.location.latitude,
      $longitude: input.location.longitude,
      $accuracy: input.location.accuracy,
      $locationSource: input.location.source,
      $createdAt: now,
      $updatedAt: now,
    }
  );

  const profile = await getProfile();

  if (!profile) {
    throw new Error('The profile could not be read after saving.');
  }

  return profile;
}

export async function updateProfileLanguage(language: Language): Promise<Profile> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE profile SET language = $language, updated_at = $updatedAt WHERE id = 1',
    { $language: language, $updatedAt: new Date().toISOString() }
  );

  const profile = await getProfile();

  if (!profile) {
    throw new Error('The profile could not be read after updating its language.');
  }

  return profile;
}

export async function deleteProfile(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM profile WHERE id = 1');
}
