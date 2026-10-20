import type { Language } from '@/i18n/languages';

export type VoicePromptKey =
  | 'language.intro'
  | 'language.select_mr'
  | 'language.select_hi'
  | 'language.select_en'
  | 'details.intro'
  | 'location.intro'
  | 'location.gps_success'
  | 'gender.intro'
  | 'gender.select_female'
  | 'gender.select_male'
  | 'account_type.intro'
  | 'account_type.select_consumer'
  | 'account_type.select_producer'
  | 'role.intro'
  | 'role.select_farmer'
  | 'role.select_kirana'
  | 'role.select_entrepreneur'
  | 'profile.completed';

export type VoiceCacheEntry = {
  key: string;
  language: Language;
  text: string;
  audioBase64: string;
  createdAt?: string;
};
