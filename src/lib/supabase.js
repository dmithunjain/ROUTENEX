import { createClient } from '@supabase/supabase-js'
import { ENV, isSupabaseConfigured } from '@/config/env'

/**
 * The single Supabase client for the app.
 * It stays `null` until credentials are supplied, so the UI can render
 * sample data without pretending a database is connected.
 */
export const supabase = isSupabaseConfigured
  ? createClient(ENV.supabaseUrl, ENV.supabaseAnonKey)
  : null
