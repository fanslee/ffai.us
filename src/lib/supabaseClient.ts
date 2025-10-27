import { createClient } from '@supabase/supabase-js'

const url = import.meta.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const anon = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export const supabaseClient = createClient(url || '', anon || '')
