import { baseURL, isLocalTarget } from "./fixtures/env.ts";

/**
 * Warms the target before the suite runs.
 *
 * A local dev server is already listening, but a Render free-plan instance spins
 * down when idle and needs roughly a minute to boot. Without this the first
 * spec would time out against a cold target.
 */
export default async function globalSetup(): Promise<void> {
  if (isLocalTarget) return;

  const deadline = Date.now() + 180_000;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    try {
      const response = await fetch(`${baseURL}/health`, { signal: AbortSignal.timeout(30_000) });
      if (response.ok) {
        console.log(`[e2e] ${baseURL} is up after ${attempt} attempt(s)`);
        return;
      }
      console.log(`[e2e] ${baseURL} responded ${response.status}, retrying`);
    } catch (error) {
      console.log(`[e2e] waiting for ${baseURL}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  throw new Error(`${baseURL} did not become healthy within 180s`);
}
