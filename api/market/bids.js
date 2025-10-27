import { supabase } from '../_lib/supabaseAdmin'
import { json, parseBody } from '../_lib/response'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })

  if (req.method === 'GET') {
    const page = parseInt(req.query.page || '1', 10)
    const size = parseInt(req.query.size || '20', 10)
    const level = req.query.level ? parseInt(req.query.level, 10) : undefined
    let q = supabase.from('bids').select('*', { count: 'exact' })
    if (level !== undefined) q = q.eq('level', level)
    const from = (page - 1) * size
    const to = from + size - 1
    const { data, error, count } = await q.order('max_unit_price', { ascending: false }).range(from, to)
    if (error) return json(res, 500, { error: error.message })
    return json(res, 200, { items: data, page, size, total: count ?? 0 })
  }

  if (req.method === 'POST') {
    const body = await parseBody(req)
    const { buyer_id, level, quantity, original_quantity, max_unit_price, remaining_budget } = body
    if (!buyer_id || level === undefined || quantity === undefined || original_quantity === undefined || max_unit_price === undefined || remaining_budget === undefined) {
      return json(res, 400, { error: 'missing fields' })
    }
    const { resolveUserId } = await import('../_lib/auth')
    const uid = await resolveUserId(req)
    if (!uid || uid !== buyer_id) return json(res, 403, { error: 'forbidden' })

    const { data, error } = await supabase.from('bids').insert({ buyer_id, level, quantity, original_quantity, max_unit_price, remaining_budget }).select('*').single()
    if (error) return json(res, 500, { error: error.message })
    await supabase.from('transactions').insert({ user_id: buyer_id, type: 'buy', amount: 0, note: `提交买单 等级${level} 数量${quantity} 最高价${max_unit_price}`, meta_json: { level, quantity, unitPrice: max_unit_price } })
    return json(res, 200, { item: data })
  }

  if (req.method === 'DELETE') {
    const id = req.query.id
    const buyerId = req.query.buyer_id
    if (!id || !buyerId) return json(res, 400, { error: 'missing id or buyer_id' })
    const { resolveUserId } = await import('../_lib/auth')
    const uid = await resolveUserId(req)
    if (!uid || uid !== buyerId) return json(res, 403, { error: 'forbidden' })
    const { error } = await supabase.from('bids').delete().eq('id', id).eq('buyer_id', buyerId)
    if (error) return json(res, 500, { error: error.message })
    await supabase.from('transactions').insert({ user_id: buyerId, type: 'buy', amount: 0, note: `撤销买单 退款冻结资金`, meta_json: { bid_id: id } })
    return json(res, 200, { ok: true })
  }

  return json(res, 405, { error: 'method not allowed' })
}
