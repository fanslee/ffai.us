import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import { useGame } from '../../store/game'
import './index.scss'

export default function Wallet() {
  const { player, recharge, transactions } = useGame()
  const frozen = player.frozen || 0
  const frozenListed = player.frozenListed || 0
  const [value, setValue] = useState(10)
  const items = useMemo(() => transactions, [transactions])
  const TYPE_LABELS: Record<string, string> = { feed: '喂养', steal: '偷取', recharge: '充值', list: '挂牌', buy: '购买', friendFeed: '互喂' }
  const fmt = (t: number) => {
    const d = new Date(t)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  }

  const [filter, setFilter] = useState<'全部' | TxType>('全部')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = items.filter(i => filter === '全部' ? true : i.type === filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize)

  useEffect(() => { if (page > totalPages) setPage(1) }, [filter, totalPages])

  return (
    <View className='wallet'>
      <Text>钱包</Text>
      <View style={{ marginTop: '12px' }}>青团余额：{player.balance}</View>
      <View style={{ marginTop: '12px' }}>
        <Input type='number' value={String(value)} onInput={e => setValue(Number(e.detail.value))} placeholder='充值金额' />
        <Button style={{ marginTop: '8px' }} onClick={() => recharge(value)}>充值</Button>
      </View>
      <View style={{ marginTop: '8px', color: '#6b7280' }}>冻结中：{frozen}</View>
      <View style={{ marginTop: '4px', color: '#6b7280' }}>上架占用：{frozenListed}</View>

      <View style={{ marginTop: '16px' }}>
        <Text>账单明细</Text>
        {items.length === 0 ? (
          <View style={{ marginTop: '8px' }}>暂无记录</View>
        ) : (
          items.map(tx => (
            <View key={tx.id} style={{ marginTop: '8px', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }}>
              <View style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>类型：{TYPE_LABELS[tx.type]}</Text>
                <Text style={{ color: tx.amount >= 0 ? '#16a34a' : '#dc2626' }}>{tx.amount >= 0 ? `+${tx.amount}` : `${tx.amount}`}</Text>
              </View>
              {tx.note && <View>说明：{tx.note}</View>}
              <View style={{ color: '#6b7280' }}>时间：{fmt(tx.time)}</View>
            </View>
          ))
        )}
        <View style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button size='mini' disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>上一页</Button>
          <Text>{page}/{totalPages}</Text>
          <Button size='mini' disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>下一页</Button>
        </View>
      </View>
    </View>
  )
}
