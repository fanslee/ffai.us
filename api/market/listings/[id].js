import { supabase } from '../../_lib/supabaseAdmin'
import { json, parseBody } from '../../_lib/response'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })

  const id = (req.query.id || '').toString()
  if (!id) return json(res, 400, { error: 'missing id' })

  if (req.method === 'PATCH') {
    const body = await parseBody(req)
    const { seller_id, unit_price } = body
    if (!seller_id || unit_price === undefined) return json(res, 400, { error: 'missing seller_id or unit_price' })
    const { resolveUserId } = await import('../../_lib/auth')
    const uid = await resolveUserId(req)
    if (!uid || uid !== seller_id) return json(res, 403, { error: 'forbidden' })
    const { data, error } = await supabase
      .from('listings')
      .update({ unit_price })
      .eq('id', id)
      .eq('seller_id', seller_id)
      .select('*')
      .single()
    if (error) return json(res, 500, { error: error.message })
    return json(res, 200, { item: data })
  }

  if (req.method === 'DELETE') {
    const sellerId = (req.query.seller_id || '').toString() || (req.headers['x-seller-id'] || '').toString()
    if (!sellerId) return json(res, 400, { error: 'missing seller_id' })
    const { resolveUserId } = await import('../../_lib/auth')
    const uid = await resolveUserId(req)
    if (!uid || uid !== sellerId) return json(res, 403, { error: 'forbidden' })
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('seller_id', sellerId)
    if (error) return json(res, 500, { error: error.message })
    return json(res, 200, { ok: true })
  }

  return json(res, 405, { error: 'method not allowed' })
}
