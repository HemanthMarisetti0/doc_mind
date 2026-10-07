const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/** Fail fast on boot if a required secret is missing. */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return env;
}
