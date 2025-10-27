import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY

const supabaseAnon = createClient(url || '', anon || '', {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function resolveUserId(req) {
  const header = req.headers['authorization'] || req.headers['Authorization']
  if (header && typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7)
    try {
      const { data, error } = await supabaseAnon.auth.getUser(token)
      if (!error && data?.user?.id) return data.user.id
    } catch {}
  }
  const xuid = (req.headers['x-user-id'] || req.query?.user_id || '').toString()
  return xuid || ''
}
