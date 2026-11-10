/**
 * Tiny JSON helpers for the web (localStorage) repositories, mirroring what
 * the native SQLite repositories do. Every access is guarded so private-mode
 * or quota failures degrade to empty reads instead of crashes.
 */
export function readJsonArray<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeJsonArray<T>(key: string, items: readonly T[]): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch (err) {
    console.warn(`Could not write ${key} to localStorage:`, err);
    return false;
  }
}

export function removeStorageKey(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}
