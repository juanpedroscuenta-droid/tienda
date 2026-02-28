import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uwgrmfxxayybglbbvhph.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Rf3YMwPQqBkIZknge2W2cg_mhBN9LTy'
// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Export auth and database for use throughout the app
export const auth = supabase.auth
export const db = supabase

