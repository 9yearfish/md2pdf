/**
 * Dynamic imports that survive a dropped connection.
 *
 * A code-split chunk can fail to load on a flaky line (Safari reports
 * "Importing a module script failed."). Retry a couple of times, and never
 * keep a rejected promise around, or every later call fails without trying.
 * Some browsers remember a failed module for the life of the page; for that
 * case `isChunkLoadError` lets the caller offer a reload.
 */
export async function importWithRetry<T>(load: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await load();
    } catch (error) {
      if (attempt >= attempts || !isChunkLoadError(error)) throw error;
      await new Promise(resolve => setTimeout(resolve, 700 * attempt));
    }
  }
}

/** The browsers' wording for a code chunk that could not be fetched or evaluated. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /importing a module script failed|failed to fetch dynamically imported module|error loading dynamically imported module|unable to preload css/i.test(message);
}
