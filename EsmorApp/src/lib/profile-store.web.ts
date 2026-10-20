import { isLanguage, type Language } from '@/i18n/languages';
import {
  isGender,
  isLocationSource,
  isUserCategory,
  isUserRole,
  type NewProfile,
  type Profile,
} from '@/types/profile';

/**
 * SQLite requires WASM + cross-origin isolation on the web. The app only needs
 * a single local profile, so web uses the browser's localStorage while iOS and
 * Android use the real SQLite repository in profile-store.ts.
 */
const STORAGE_KEY = 'esmor.profile.v1';

function readStoredProfile(): Profile | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Profile>;

    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.age !== 'number' ||
      typeof parsed.phone !== 'string' ||
      !isGender(parsed.gender) ||
      !isLanguage(parsed.language) ||
      !parsed.location ||
      !isLocationSource(parsed.location.source) ||
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.updatedAt !== 'string'
    ) {
      return null;
    }

    const category = isUserCategory(parsed.category)
      ? parsed.category
      : parsed.role === 'consumer'
        ? 'consumer'
        : 'producer';

    return {
      ...parsed,
      category,
      role: isUserRole(parsed.role) ? parsed.role : category === 'consumer' ? 'consumer' : 'farmer',
    } as Profile;
  } catch {
    return null;
  }
}

function writeStoredProfile(profile: Profile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export async function getProfile(): Promise<Profile | null> {
  return readStoredProfile();
}

export async function saveProfile(input: NewProfile): Promise<Profile> {
  const existing = readStoredProfile();
  const now = new Date().toISOString();
  const category = isUserCategory(input.category)
    ? input.category
    : input.role === 'consumer'
      ? 'consumer'
      : 'producer';

  const profile: Profile = {
    ...input,
    category,
    role: isUserRole(input.role) ? input.role : category === 'consumer' ? 'consumer' : 'farmer',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  writeStoredProfile(profile);
  return profile;
}

export async function updateProfileLanguage(language: Language): Promise<Profile> {
  const existing = readStoredProfile();

  if (!existing) {
    throw new Error('No local profile exists.');
  }

  const profile: Profile = {
    ...existing,
    language,
    updatedAt: new Date().toISOString(),
  };

  writeStoredProfile(profile);
  return profile;
}

export async function deleteProfile(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
