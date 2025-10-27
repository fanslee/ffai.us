import { supabase } from '../../_lib/supabaseAdmin'
import { json, parseBody } from '../../_lib/response'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })

  const body = await parseBody(req)
  const { buyer_id, level, quantity, max_unit_price, min_unit_price = 0 } = body
  if (!buyer_id || !level || !quantity || !max_unit_price) return json(res, 400, { error: 'missing fields' })

  // 拉取符合条件的卖单
  const { data: listings, error: e1 } = await supabase
    .from('listings')
    .select('*')
    .eq('level', level)
    .gte('unit_price', min_unit_price)
    .lte('unit_price', max_unit_price)
    .order('unit_price', { ascending: true })
    .order('created_at', { ascending: true })
  if (e1) return json(res, 500, { error: e1.message })

  // 鉴权：buyer_id 必须等于当前用户
  const { resolveUserId } = await import('../../_lib/auth')
  const uid = await resolveUserId(req)
  if (!uid || uid !== buyer_id) return json(res, 403, { error: 'forbidden' })

  let remain = quantity
  let spent = 0
  const touched = []

  for (const l of listings || []) {
    if (remain <= 0) break
    const dealQty = Math.min(remain, l.amount)
    const dealAmt = dealQty * Number(l.unit_price)
    remain -= dealQty
    spent += dealAmt

    const left = l.amount - dealQty
    if (left > 0) {
      const { error } = await supabase.from('listings').update({ amount: left }).eq('id', l.id)
      if (error) return json(res, 500, { error: error.message })
    } else {
      const { error } = await supabase.from('listings').delete().eq('id', l.id)
      if (error) return json(res, 500, { error: error.message })
    }
    touched.push({ id: l.id, dealt: dealQty, price: Number(l.unit_price) })
  }

  const matchedQty = quantity - remain
  const avgPrice = matchedQty ? Math.round((spent / matchedQty) * 100) / 100 : 0

  // 交易流水（买家）
  if (spent > 0) {
    await supabase.from('transactions').insert({
      user_id: buyer_id,
      type: 'buy',
      amount: -spent,
      note: `市价买入 等级${level} 成交${matchedQty}/${quantity}`,
      meta_json: { level, quantity: matchedQty, unitPrice: avgPrice, details: touched }
    })
  }

  return json(res, 200, { buyer_id, level, requested: quantity, matchedQty, spent, avgPrice, details: touched })
}
