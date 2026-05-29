import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client.
 *
 * The Vercel/Upstash integration provisioned these env vars under the
 * `KV_REST_API_*` names (Vercel's KV naming convention), so we read those
 * explicitly rather than using Redis.fromEnv() (which looks for
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 *
 * If you ever rename the env vars to the UPSTASH_* convention, you can switch
 * to: export const redis = Redis.fromEnv();
 */
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// How long a pending form payload lives before it self-expires (seconds).
// 24h is plenty: the user pays and generates within minutes; this is just a
// safety window so abandoned/unpaid submissions don't linger.
export const FORM_TTL_SECONDS = 60 * 60 * 24;

// How long a generated letter is cached against its Stripe session (seconds).
// Lets the success page be re-visited / retried without regenerating (and
// without a second Anthropic API charge). 7 days.
export const LETTER_TTL_SECONDS = 60 * 60 * 24 * 7;

export const formKey = (formId: string) => `form:${formId}`;
export const letterKey = (sessionId: string) => `letter:${sessionId}`;
