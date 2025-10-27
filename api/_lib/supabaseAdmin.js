import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.warn('[supabaseAdmin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables')
}

export const supabase = createClient(url || '', serviceKey || '', {
  auth: { autoRefreshToken: false, persistSession: false }
})
