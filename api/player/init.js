import { supabase } from '../_lib/supabaseAdmin'
import { json } from '../_lib/response'
import { resolveUserId } from '../_lib/auth'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'POST' && req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
  const uid = await resolveUserId(req)
  if (!uid) return json(res, 401, { error: 'unauthorized' })

  // 尝试读取用户
  const { data: user, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle()
  if (error) return json(res, 500, { error: error.message })
  if (user) return json(res, 200, { user })

  // 若不存在则初始化一条记录
  const { data: created, error: e2 } = await supabase.from('users').insert({ id: uid, balance: 0, frozen: 0, frozen_listed: 0 }).select('*').single()
  if (e2) return json(res, 500, { error: e2.message })
  return json(res, 200, { user: created })
}
