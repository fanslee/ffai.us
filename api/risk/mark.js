import { supabase } from '../_lib/supabaseAdmin'
import { json, parseBody } from '../_lib/response'
import { resolveUserId } from '../_lib/auth'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
  const uid = await resolveUserId(req)
  if (!uid) return json(res, 401, { error: 'unauthorized' })
  const body = await parseBody(req)
  const { key } = body
  if (!key) return json(res, 400, { error: 'missing key' })
  const { error } = await supabase.from('risk_events').insert({ user_id: uid, key })
  if (error) return json(res, 500, { error: error.message })
  return json(res, 200, { ok: true })
}
