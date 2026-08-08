import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Player-facing anon client (respects RLS — only sees non-hidden entries)
// Used for public world pages
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) =>
      fetch(url, { ...options, cache: 'no-store' }),
  },
})

// Auth-aware browser client — used in player-facing authenticated pages
// Automatically manages session cookies
export function createPlayerClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
