import type { Language } from '@/i18n/languages';

export type Gender = 'female' | 'male';

export type LocationSource = 'gps' | 'manual';

export type ProfileLocation = {
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  source: LocationSource;
};

export type Profile = {
  name: string;
  age: number;
  phone: string;
  gender: Gender;
  language: Language;
  location: ProfileLocation;
  createdAt: string;
  updatedAt: string;
};

export type NewProfile = Omit<Profile, 'createdAt' | 'updatedAt'>;

export function isGender(value: unknown): value is Gender {
  return value === 'female' || value === 'male';
}

export function isLocationSource(value: unknown): value is LocationSource {
  return value === 'gps' || value === 'manual';
}
