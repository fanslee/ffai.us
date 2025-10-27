import { supabase } from '../../_lib/supabaseAdmin'
import { json, parseBody } from '../../_lib/response'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })

  const body = await parseBody(req)
  const { seller_id, level, quantity, min_unit_price } = body
  if (!seller_id || !level || !quantity || min_unit_price === undefined) return json(res, 400, { error: 'missing fields' })

  // 拉取符合条件的买单（按价格从高到低、时间先后）
  const { data: bids, error: e1 } = await supabase
    .from('bids')
    .select('*')
    .eq('level', level)
    .gte('max_unit_price', min_unit_price)
    .order('max_unit_price', { ascending: false })
    .order('created_at', { ascending: true })
  if (e1) return json(res, 500, { error: e1.message })

  // 鉴权：seller_id 必须等于当前用户
  const { resolveUserId } = await import('../../_lib/auth')
  const uid = await resolveUserId(req)
  if (!uid || uid !== seller_id) return json(res, 403, { error: 'forbidden' })

  let remain = quantity
  let income = 0
  const touched = []

  for (const b of bids || []) {
    if (remain <= 0) break
    const dealQty = Math.min(remain, b.quantity)
    const price = Number(b.max_unit_price)
    const dealAmt = dealQty * price
    const nextQty = b.quantity - dealQty
    const nextBudget = Math.max(0, Number(b.remaining_budget ?? b.quantity * price) - dealAmt)
    remain -= dealQty
    income += dealAmt

    if (nextQty > 0) {
      const { error } = await supabase.from('bids').update({ quantity: nextQty, remaining_budget: nextBudget }).eq('id', b.id)
      if (error) return json(res, 500, { error: error.message })
    } else {
      const { error } = await supabase.from('bids').delete().eq('id', b.id)
      if (error) return json(res, 500, { error: error.message })
    }
    touched.push({ id: b.id, dealt: dealQty, price })
  }

  const matchedQty = quantity - remain
  const avgPrice = matchedQty ? Math.round((income / matchedQty) * 100) / 100 : 0

  // 交易流水（卖家）
  if (income > 0) {
    await supabase.from('transactions').insert({
      user_id: seller_id,
      type: 'sell',
      amount: income,
      note: `市价卖出 等级${level} 成交${matchedQty}/${quantity}`,
      meta_json: { level, quantity: matchedQty, unitPrice: avgPrice, details: touched }
    })
  }

  return json(res, 200, { seller_id, level, requested: quantity, matchedQty, income, avgPrice, details: touched })
}
