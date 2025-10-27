import { supabase } from '../_lib/supabaseAdmin'
import { json, parseBody } from '../_lib/response'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })

  if (req.method === 'GET') {
    const page = parseInt(req.query.page || '1', 10)
    const size = parseInt(req.query.size || '20', 10)
    const level = req.query.level ? parseInt(req.query.level, 10) : undefined
    let q = supabase.from('listings').select('*', { count: 'exact' })
    if (level !== undefined) q = q.eq('level', level)
    const from = (page - 1) * size
    const to = from + size - 1
    const { data, error, count } = await q.order('unit_price', { ascending: true }).range(from, to)
    if (error) return json(res, 500, { error: error.message })
    return json(res, 200, { items: data, page, size, total: count ?? 0 })
  }

  if (req.method === 'POST') {
    const body = await parseBody(req)
    const { seller_id, level, amount, unit_price, min_price, title } = body
    if (!seller_id || level === undefined || amount === undefined || unit_price === undefined || min_price === undefined) {
      return json(res, 400, { error: 'missing fields' })
    }
    // 鉴权：seller_id 必须等于当前用户
    const { resolveUserId } = await import('../_lib/auth')
    const uid = await resolveUserId(req)
    if (!uid || uid !== seller_id) return json(res, 403, { error: 'forbidden' })

    const { data, error } = await supabase.from('listings').insert({ seller_id, level, amount, unit_price, min_price, title }).select('*').single()
    if (error) return json(res, 500, { error: error.message })
    // 交易流水：上架记录（amount 不计入金额）
    await supabase.from('transactions').insert({ user_id: seller_id, type: 'list', amount: 0, note: `挂牌 等级${level} 数量${amount} 单价${unit_price}`, meta_json: { level, quantity: amount, unitPrice: unit_price } })
    return json(res, 200, { item: data })
  }

  return json(res, 405, { error: 'method not allowed' })
}
