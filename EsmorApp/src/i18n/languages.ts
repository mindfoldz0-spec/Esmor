export const LANGUAGES = [
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    tile: 'A',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    tile: 'हि',
  },
  {
    code: 'mr',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    tile: 'म',
  },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: Language = 'hi';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

export function getLanguage(language: Language) {
  return LANGUAGES.find((option) => option.code === language) ?? LANGUAGES[0];
}
