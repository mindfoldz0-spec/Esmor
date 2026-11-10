/**
 * fetch() with an AbortController timeout.
 *
 * The app relies on graceful fallbacks (offline agent, cached audio, banner
 * errors) that only trigger when a request throws. A stalling connection
 * never throws on its own, so every external call needs a hard deadline.
 */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
