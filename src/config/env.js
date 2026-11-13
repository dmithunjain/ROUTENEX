/**
 * Environment access in one place so modules never read `import.meta.env` directly.
 * Only `VITE_`-prefixed values are exposed to the browser — never put secrets here.
 */
const env = import.meta.env

export const ENV = {
  supabaseUrl: env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? '',
  aiApiUrl: env.VITE_AI_API_URL ?? '',
}

export const isSupabaseConfigured = Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey)
