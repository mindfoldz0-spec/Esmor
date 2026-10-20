import type { Language } from '@/i18n/languages';

const SHORT_MONTHS: Record<Language, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hi: [
    'जन॰',
    'फ़र॰',
    'मार्च',
    'अप्रैल',
    'मई',
    'जून',
    'जुल॰',
    'अग॰',
    'सित॰',
    'अक्तू॰',
    'नव॰',
    'दिस॰',
  ],
  mr: [
    'जाने.',
    'फेब्रु.',
    'मार्च',
    'एप्रि.',
    'मे',
    'जून',
    'जुलै',
    'ऑग.',
    'सप्टें.',
    'ऑक्टो.',
    'नोव्हें.',
    'डिसें.',
  ],
};

const LONG_MONTHS: Record<Language, readonly string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  hi: [
    'जनवरी',
    'फ़रवरी',
    'मार्च',
    'अप्रैल',
    'मई',
    'जून',
    'जुलाई',
    'अगस्त',
    'सितंबर',
    'अक्तूबर',
    'नवंबर',
    'दिसंबर',
  ],
  mr: [
    'जानेवारी',
    'फेब्रुवारी',
    'मार्च',
    'एप्रिल',
    'मे',
    'जून',
    'जुलै',
    'ऑगस्ट',
    'सप्टेंबर',
    'ऑक्टोबर',
    'नोव्हेंबर',
    'डिसेंबर',
  ],
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Formats the date shown under the home greeting, for example "25 Nov".
 */
export function formatTodayDate(language: Language, date: Date = new Date()) {
  return `${date.getDate()} ${SHORT_MONTHS[language][date.getMonth()]}`;
}

/**
 * Formats a time of day, for example "14:05".
 */
export function formatTimeOfDay(value: Date | string) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Formats a profile creation date, for example "November 2025".
 */
export function formatMonthYear(language: Language, value: Date | string) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${LONG_MONTHS[language][date.getMonth()]} ${date.getFullYear()}`;
}
