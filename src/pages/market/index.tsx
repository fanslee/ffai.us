import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, Input, Button, Picker } from '@tarojs/components'
import { showToast } from '@tarojs/taro'
import { useGame, getActionQuota } from '../../store/game'
import { BASE_QINGTUAN_PRICE, MAX_QINGTUAN_PRICE } from '../../constants/price'
import './index.scss'

export default function Market() {
  const { player, risk, listings, listQingtuan, buyListing, marketBuy, transactions, placeBid, marketSell, bids, cancelBid, cancelListing, updateListingPrice, exportSave, importSave, importSaveMerge, resetAll, markAction } = useGame()
  const [levelIdx, setLevelIdx] = useState(0)
  const levels = useMemo(() => [1, 2, 3, 4, 5] as const, [])
  const [amount, setAmount] = useState(1)
  const [unitPrice, setUnitPrice] = useState(1)
  // 快速购买参数
  const [buyQty, setBuyQty] = useState(1)
  const [buyMax, setBuyMax] = useState(1)
  // 下买单与快速卖出参数
  const [bidQty, setBidQty] = useState(1)
  const [bidMax, setBidMax] = useState(1)
  const [sellQty, setSellQty] = useState(1)
  const [sellMin, setSellMin] = useState(1)
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({})
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const quotasMap = React.useMemo(() => {
    const arr = getActionQuota(risk)
    return Object.fromEntries(arr.map(q => [q.key, q])) as Record<string, { used: number; limit: number; remain: number }>
  }, [risk, tick])

  const level = levels[levelIdx]
  const minPrice = BASE_QINGTUAN_PRICE[level]
  const maxPrice = MAX_QINGTUAN_PRICE[level]
  const avgPrice = useMemo(() => {
    const buys = transactions.filter(t => (t.type === 'buy' || t.type === 'sell') && t.meta?.level === level && t.meta?.unitPrice)
    const totalQty = buys.reduce((s, b) => s + (b.meta?.quantity || 0), 0)
    const totalAmt = buys.reduce((s, b) => s + (b.meta!.unitPrice! * (b.meta?.quantity || 0)), 0)
    if (totalQty <= 0) return 0
    return Math.round((totalAmt / totalQty) * 100) / 100
  }, [transactions, level])

  // 价格历史与成交统计（当前等级）
  const history = useMemo(() => {
    return transactions
      .filter(t => (t.type==='buy' || t.type==='sell') && t.meta?.level===level && t.meta?.unitPrice)
      .map(t => ({ time: t.time, price: t.meta!.unitPrice!, qty: t.meta?.quantity || 0, type: t.type }))
      .sort((a,b)=> a.time - b.time)
  }, [transactions, level])
  const lastN = 20
  const recent = useMemo(() => history.slice(Math.max(0, history.length - lastN)), [history])
  const minP = useMemo(() => recent.length? Math.min(...recent.map(r=>r.price)) : 0, [recent])
  const maxP = useMemo(() => recent.length? Math.max(...recent.map(r=>r.price)) : 0, [recent])
  const now = Date.now()
  const windowMs = 24*60*60*1000
  const in24h = useMemo(() => history.filter(h => now - h.time <= windowMs), [history])
  const vol24h = useMemo(() => in24h.reduce((s,h)=> s + h.qty, 0), [in24h])
  const trades24h = useMemo(() => in24h.length, [in24h])

  const onList = () => {
    if (unitPrice < minPrice) {
      showToast({ title: `单价不得低于${minPrice}`, icon: 'error' })
      return
    }
    if (unitPrice > maxPrice) {
      showToast({ title: `单价不得高于${maxPrice}`, icon: 'error' })
      return
    }
    listQingtuan(unitPrice, minPrice, { amount, color: 'green', level })
  }

  const onPlaceBid = () => {
    if (bidMax < minPrice) { showToast({ title: `出价不得低于${minPrice}`, icon: 'error' }); return }
    placeBid(level, bidQty, bidMax)
  }

  const onMarketSell = () => {
    if (sellMin > maxPrice) { showToast({ title: `最低成交价不得高于${maxPrice}`, icon: 'error' }); return }
    marketSell(level, sellQty, sellMin)
  }

  const onMarketBuy = () => {
    if (buyMax < minPrice) {
      showToast({ title: `出价不得低于${minPrice}`, icon: 'error' })
      return
    }
    marketBuy(level, buyQty, buyMax, minPrice)
  }

  const [filterLevel, setFilterLevel] = useState<'全部' | 1 | 2 | 3 | 4 | 5>('全部')
  const [sortKey, setSortKey] = useState<'priceAsc' | 'priceDesc' | 'qtyDesc'>('priceAsc')
  const displayListings = useMemo(() => {
    const arr = listings.filter(l => filterLevel==='全部' ? true : l.qingtuan.level===filterLevel)
    switch (sortKey) {
      case 'priceAsc': return arr.slice().sort((a,b)=> a.unitPrice - b.unitPrice)
      case 'priceDesc': return arr.slice().sort((a,b)=> b.unitPrice - a.unitPrice)
      case 'qtyDesc': return arr.slice().sort((a,b)=> b.qingtuan.amount - a.qingtuan.amount)
      default: return arr
    }
  }, [listings, filterLevel, sortKey])

  return (
    <View className='market'>
      <Text>青团交易市场</Text>

      <View style={{ marginTop: '12px' }}>
        <Text>我要挂牌</Text>
        <View style={{ marginTop: '8px' }}>
          <Picker mode='selector' range={levels.map(l => `等级${l}`)} onChange={e => setLevelIdx(Number(e.detail.value))}>
            <View>青团等级：等级{levels[levelIdx]}</View>
          </Picker>
        </View>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(amount)} onInput={e => setAmount(Number(e.detail.value))} placeholder='数量' />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(unitPrice)} onInput={e => setUnitPrice(Number(e.detail.value))} placeholder={`单价(${minPrice}~${maxPrice})`} />
        </View>
        <View style={{ marginTop: '4px', color: '#6b7280' }}>
          <Text>最低价：{minPrice}，上限价：{maxPrice}{avgPrice ? `，近成交均价：${avgPrice}` : ''}</Text>
        </View>
        <View style={{ marginTop: '8px' }}>
          <Button disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0)} onClick={onList}>挂牌</Button>
          <Text style={{ marginLeft: '8px', color: '#6b7280' }}>剩余{quotasMap['list']?.remain ?? 0}</Text>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，挂牌{listings.length}条，买单{bids.length}条，交易{transactions.length}条</Text>
        </View>
      </View>

      <View style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
        <Text>风控提示：{risk.blockedUntil > Date.now() ? `封禁中，剩余${Math.ceil((risk.blockedUntil - Date.now())/1000)}s` : '正常'}</Text>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {getActionQuota(risk).map(q => (
            <View key={q.key} style={{ padding: '4px 8px', border: '1px solid #eee', borderRadius: '6px' }}>
              <Text>{q.key}: {q.used}/{q.limit}（剩余{q.remain}）</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['export']?.remain === 0)} onClick={() => { if (!markAction('export')) return; const json = exportSave(); if (!json) return; const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob as any); const a = document.createElement('a'); a.href = url; a.download = `CutePartySave_${new Date().toISOString().replace(/[:.]/g,'-')}.json`; a.click(); URL.revokeObjectURL(url) }}>导出存档</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSave(text) }; input.click() }}>导入存档</Button>
          <Button size='mini' onClick={() => resetAll()}>一键重置</Button>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，挂牌{listings.length}条，买单{bids.length}条，交易{transactions.length}条</Text>
        </View>
      </View>

      <View style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
        <Text>下买单（加入买单队列）</Text>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(bidQty)} onInput={e => setBidQty(Number(e.detail.value))} placeholder='买单数量' />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(bidMax)} onInput={e => setBidMax(Number(e.detail.value))} placeholder={`最高单价（≥${minPrice}）`} />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Button disabled={risk.blockedUntil > Date.now() || (quotasMap['bid']?.remain === 0)} onClick={onPlaceBid}>提交买单</Button>
          <Text style={{ marginLeft: '8px', color: '#6b7280' }}>剩余{quotasMap['bid']?.remain ?? 0}</Text>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，挂牌{listings.length}条，买单{bids.length}条，交易{transactions.length}条</Text>
        </View>
      </View>

      <View style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
        <Text>快速购买撮合</Text>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(buyQty)} onInput={e => setBuyQty(Number(e.detail.value))} placeholder='购买数量' />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(buyMax)} onInput={e => setBuyMax(Number(e.detail.value))} placeholder={`最高单价（≥${minPrice}）`} />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Button disabled={risk.blockedUntil > Date.now() || (quotasMap['buy']?.remain === 0)} onClick={onMarketBuy}>撮合购买</Button>
          <Text style={{ marginLeft: '8px', color: '#6b7280' }}>剩余{quotasMap['buy']?.remain ?? 0}</Text>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，挂牌{listings.length}条，买单{bids.length}条，交易{transactions.length}条</Text>
        </View>
      </View>

      <View style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
        <Text>快速卖出撮合</Text>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(sellQty)} onInput={e => setSellQty(Number(e.detail.value))} placeholder='卖出数量' />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Input type='number' value={String(sellMin)} onInput={e => setSellMin(Number(e.detail.value))} placeholder={`最低单价（≤${maxPrice}）`} />
        </View>
        <View style={{ marginTop: '8px' }}>
          <Button disabled={risk.blockedUntil > Date.now() || (quotasMap['sell']?.remain === 0)} onClick={onMarketSell}>撮合卖出</Button>
          <Text style={{ marginLeft: '8px', color: '#6b7280' }}>剩余{quotasMap['sell']?.remain ?? 0}</Text>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，挂牌{listings.length}条，买单{bids.length}条，交易{transactions.length}条</Text>
        </View>
      </View>

      <View style={{ marginTop: '16px' }}>
        <Text>市场挂单</Text>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text>筛选等级：</Text>
          {(['全部',1,2,3,4,5] as const).map(l => (
            <Button size='mini' key={String(l)} onClick={() => setFilterLevel(l as any)} type={filterLevel===l?'primary':'default'}>{String(l)}</Button>
          ))}
          <Text>排序：</Text>
          {(['priceAsc','priceDesc','qtyDesc'] as const).map(k => (
            <Button size='mini' key={k} onClick={() => setSortKey(k)} type={sortKey===k?'primary':'default'}>{k}</Button>
          ))}
        </View>
        {displayListings.length === 0 ? (
          <View style={{ marginTop: '8px' }}>暂无挂单</View>
        ) : (
          displayListings.map(l => (
            <View key={l.id} style={{ marginTop: '8px', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }}>
              <Text>{l.title || `等级${l.qingtuan.level} 青团 x${l.qingtuan.amount}`}</Text>
              <View>单价：{l.unitPrice}（最低价：{l.minPrice}）</View>
              <View style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button onClick={() => buyListing(l.id)}>购买</Button>
                {l.sellerId === player.id && (
                  <>
                    <Button type='warn' disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0)} onClick={() => cancelListing(l.id)}>撤单</Button>
                    <Text style={{ color: '#6b7280' }}>剩余{quotasMap['list']?.remain ?? 0}</Text>
                    <Input style={{ width: '100px' }} type='number' value={String(priceEdits[l.id] ?? l.unitPrice)} onInput={e => setPriceEdits(m => ({ ...m, [l.id]: Number(e.detail.value) }))} placeholder='新单价' />
                    <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0)} onClick={() => {
                      const newP = priceEdits[l.id] ?? l.unitPrice
                      const lvl = l.qingtuan.level
                      const minP = BASE_QINGTUAN_PRICE[lvl]
                      const maxP = MAX_QINGTUAN_PRICE[lvl]
                      if (newP < minP) { showToast({ title: `单价不得低于${minP}`, icon: 'error' }); return }
                      if (newP > maxP) { showToast({ title: `单价不得高于${maxP}`, icon: 'error' }); return }
                      updateListingPrice(l.id, newP)
                    }}>改价</Button>
                    <Text style={{ color: '#6b7280' }}>剩余{quotasMap['list']?.remain ?? 0}</Text>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ marginTop: '16px' }}>
        <Text>买单队列（当前等级）</Text>
        {bids.filter(b => b.level===level).length===0 ? (
          <View style={{ marginTop: '8px' }}>暂无买单</View>
        ) : (
          bids.filter(b => b.level===level).sort((a,b)=> b.maxUnitPrice - a.maxUnitPrice || a.createdAt - b.createdAt).map(b => (
            <View key={b.id} style={{ marginTop: '8px', padding: '8px', border: '1px dashed #ddd', borderRadius: '8px' }}>
              <View>数量：{b.quantity}（已成交：{(b.originalQuantity ?? b.quantity) - b.quantity}） 最高价：{b.maxUnitPrice}</View>
              <View style={{ color: '#6b7280' }}>时间：{new Date(b.createdAt).toLocaleString()}</View>
              <View style={{ color: '#6b7280' }}>剩余预算：{b.remainingBudget ?? b.quantity * b.maxUnitPrice}</View>
              {b.buyerId === player.id && (
                <>
                  <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['bid']?.remain === 0)} style={{ marginTop: '6px' }} onClick={() => cancelBid(b.id)}>撤单</Button>
                  <Text style={{ color: '#6b7280' }}>剩余{quotasMap['bid']?.remain ?? 0}</Text>
                </>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  )
}
