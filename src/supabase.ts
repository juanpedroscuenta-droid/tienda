import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uwgrmfxxayybglbbvhph.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Rf3YMwPQqBkIZknge2W2cg_mhBN9LTy'

// noOpLock: evita el navigator.locks ejecutando el callback directamente.
// Esto elimina el NavigatorLockAcquireTimeoutError cuando hay múltiples pestañas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noOpLock = (_name: string, _timeout: number, fn: () => Promise<any>) => fn()

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        // Fix: reemplaza navigator.locks para evitar el NavigatorLockAcquireTimeoutError
        lock: noOpLock,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Sin storageKey personalizado — usa la clave por defecto de Supabase
        // para no perder sesiones de usuarios ya autenticados
    },
})



// Export auth and database for use throughout the app
export const auth = supabase.auth
export const db = supabase
