import { supabase, auth, db } from "./supabase"

// Re-export Supabase as Firebase for backward compatibility
export { auth, db, supabase }

// Firebase Storage compatibility - using Supabase Storage
export const storage = supabase.storage

// Firebase Functions compatibility - using Supabase functions
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: { email, name }
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }
}