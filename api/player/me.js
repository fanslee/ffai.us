import { supabase } from '../_lib/supabaseAdmin'
import { json } from '../_lib/response'
import { resolveUserId } from '../_lib/auth'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })

  const userId = await resolveUserId(req)
  if (!userId) return json(res, 401, { error: 'unauthorized' })

  const { data: user, error: e1 } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (e1) return json(res, 500, { error: e1.message })

  const { data: block } = await supabase
    .from('blocks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle?.() ?? { data: null }

  json(res, 200, { user, block })
}
