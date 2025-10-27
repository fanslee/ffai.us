import React, { useMemo, useState, useEffect } from 'react'
import { View, Text, Button, Input, Checkbox } from '@tarojs/components'
import { showToast, setClipboardData } from '@tarojs/taro'
import { useGame, getActionQuota } from '../../store/game'
import { BASE_QINGTUAN_PRICE, MAX_QINGTUAN_PRICE } from '../../constants/price'
import './index.scss'

export default function Orders() {
  const { player, risk, bids, listings, cancelBid, cancelListing, updateListingPrice, markAction, exportSave, importSave, importSaveMerge, resetAll, transactions } = useGame()
  const myBids = useMemo(() => bids.filter(b => b.buyerId === player.id).sort((a,b)=> b.createdAt - a.createdAt), [bids, player.id])
  const myListings = useMemo(() => listings.filter(l => l.sellerId === player.id), [listings, player.id])
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({})
  const [selectedBidIds, setSelectedBidIds] = useState<string[]>([])
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const [batchNewPrice, setBatchNewPrice] = useState<number | ''>('')
  const [tick, setTick] = useState(0)
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 1000); return () => clearInterval(t) }, [])
  const quotasMap = React.useMemo(() => {
    const arr = getActionQuota(risk)
    return Object.fromEntries(arr.map(q => [q.key, q])) as Record<string, { used: number; limit: number; remain: number }>
  }, [risk, tick])
  // 我的买单：筛选/排序/搜索/分页
  const [bidLevelFilter, setBidLevelFilter] = useState<'全部' | 1 | 2 | 3 | 4 | 5>('全部')
  const [bidSortKey, setBidSortKey] = useState<'timeDesc' | 'timeAsc' | 'priceDesc' | 'priceAsc'>('timeDesc')
  const [bidKeyword, setBidKeyword] = useState('')
  const [bidPage, setBidPage] = useState(1)
  const bidPageSize = 10
  const viewBids = useMemo(() => {
    let arr = myBids
    if (bidLevelFilter !== '全部') arr = arr.filter(b => b.level === bidLevelFilter)
    if (bidKeyword.trim()) {
      const k = bidKeyword.trim().toLowerCase()
      arr = arr.filter(b => `${b.level}`.includes(k) || `${b.maxUnitPrice}`.includes(k))
    }
    switch (bidSortKey) {
      case 'timeAsc': arr = arr.slice().sort((a,b)=> a.createdAt - b.createdAt); break
      case 'priceDesc': arr = arr.slice().sort((a,b)=> b.maxUnitPrice - a.maxUnitPrice || b.createdAt - a.createdAt); break
      case 'priceAsc': arr = arr.slice().sort((a,b)=> a.maxUnitPrice - b.maxUnitPrice || b.createdAt - a.createdAt); break
      case 'timeDesc':
      default: arr = arr.slice().sort((a,b)=> b.createdAt - a.createdAt); break
    }
    return arr
  }, [myBids, bidLevelFilter, bidSortKey, bidKeyword])
  const bidTotalPages = useMemo(() => Math.max(1, Math.ceil(viewBids.length / bidPageSize)), [viewBids.length])
  const bidPageItems = useMemo(() => viewBids.slice((bidPage-1)*bidPageSize, bidPage*bidPageSize), [viewBids, bidPage])
  
  // 我的挂单：筛选/排序/搜索/分页
  const [listLevelFilter, setListLevelFilter] = useState<'全部' | 1 | 2 | 3 | 4 | 5>('全部')
  const [listSortKey, setListSortKey] = useState<'timeDesc' | 'timeAsc' | 'priceDesc' | 'priceAsc' | 'qtyDesc' | 'qtyAsc'>('timeDesc')
  const [listKeyword, setListKeyword] = useState('')
  const [listPage, setListPage] = useState(1)
  const listPageSize = 10
  const viewListings = useMemo(() => {
    let arr = myListings
    if (listLevelFilter !== '全部') arr = arr.filter(l => l.qingtuan.level === listLevelFilter)
    if (listKeyword.trim()) {
      const k = listKeyword.trim().toLowerCase()
      arr = arr.filter(l => `${l.qingtuan.level}`.includes(k) || `${l.unitPrice}`.includes(k) || `${l.qingtuan.amount}`.includes(k) || (l.title || '').toLowerCase().includes(k))
    }
    switch (listSortKey) {
      case 'timeAsc': arr = arr.slice().sort((a,b)=> (a as any).createdAt - (b as any).createdAt); break
      case 'priceDesc': arr = arr.slice().sort((a,b)=> b.unitPrice - a.unitPrice); break
      case 'priceAsc': arr = arr.slice().sort((a,b)=> a.unitPrice - b.unitPrice); break
      case 'qtyDesc': arr = arr.slice().sort((a,b)=> b.qingtuan.amount - a.qingtuan.amount); break
      case 'qtyAsc': arr = arr.slice().sort((a,b)=> a.qingtuan.amount - b.qingtuan.amount); break
      case 'timeDesc':
      default: arr = arr.slice().sort((a,b)=> (b as any).createdAt - (a as any).createdAt); break
    }
    return arr
  }, [myListings, listLevelFilter, listSortKey, listKeyword])
  const listTotalPages = useMemo(() => Math.max(1, Math.ceil(viewListings.length / listPageSize)), [viewListings.length])
  const listPageItems = useMemo(() => viewListings.slice((listPage-1)*listPageSize, listPage*listPageSize), [viewListings, listPage])

  return (
    <View className='orders'>
      <Text>我的委托</Text>

      <View style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
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
          <Text>当前概览：余额{player.balance}，我的买单{bids.filter(b=>b.buyerId===player.id).length}条，我的挂牌{listings.filter(l=>l.sellerId===player.id).length}条，总交易{transactions.length}条</Text>
        </View>
      </View>

      <View className='section'>
        <Text>我的买单</Text>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text>筛选等级：</Text>
          {(['全部',1,2,3,4,5] as const).map(l => (
            <Button size='mini' key={String(l)} onClick={() => setBidLevelFilter(l as any)} type={bidLevelFilter===l?'primary':'default'}>{String(l)}</Button>
          ))}
          <Text>排序：</Text>
          {(['timeDesc','timeAsc','priceDesc','priceAsc'] as const).map(k => (
            <Button size='mini' key={k} onClick={() => setBidSortKey(k)} type={bidSortKey===k?'primary':'default'}>{k}</Button>
          ))}
        </View>
        {viewBids.length === 0 ? (
          <View className='empty'>暂无买单</View>
        ) : (
          viewBids.map(b => (
            <View key={b.id} className='card'>
              <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Checkbox checked={selectedBidIds.includes(b.id)} onClick={() => setSelectedBidIds(arr => arr.includes(b.id) ? arr.filter(x=>x!==b.id) : [...arr, b.id])} />
                <Text>等级：{b.level} 数量：{b.quantity}（已成交：{(b.originalQuantity ?? b.quantity) - b.quantity}）</Text>
              </View>
              <View>最高价：{b.maxUnitPrice}</View>
              <View style={{ color: '#6b7280' }}>剩余预算：{b.remainingBudget ?? b.quantity * b.maxUnitPrice}</View>
              <View style={{ color: '#6b7280' }}>时间：{new Date(b.createdAt).toLocaleString()}</View>
              <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['bid']?.remain === 0)} onClick={() => cancelBid(b.id)}>撤单</Button>
              <Text style={{ color: '#6b7280' }}>剩余{quotasMap['bid']?.remain ?? 0}{risk.blockedUntil > Date.now() ? '（封禁中）' : (quotasMap['bid']?.remain === 0 ? '（配额用尽）' : '')}</Text>
            </View>
          ))
        )}
        <View style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button size='mini' disabled={bidPage<=1} onClick={() => setBidPage(p => Math.max(1, p-1))}>上一页</Button>
          <Text>{bidPage}/{bidTotalPages}</Text>
          <Button size='mini' disabled={bidPage>=bidTotalPages} onClick={() => setBidPage(p => Math.min(bidTotalPages, p+1))}>下一页</Button>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，我的买单{bids.filter(b=>b.buyerId===player.id).length}条，我的挂牌{listings.filter(l=>l.sellerId===player.id).length}条，总交易{transactions.length}条</Text>
        </View>
      </View>

      <View className='section'>
        <Text>我的挂单</Text>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text>筛选等级：</Text>
          {(['全部',1,2,3,4,5] as const).map(l => (
            <Button size='mini' key={String(l)} onClick={() => { setListLevelFilter(l as any); setListPage(1) }} type={listLevelFilter===l?'primary':'default'}>{String(l)}</Button>
          ))}
          <Text>排序：</Text>
          {(['timeDesc','timeAsc','priceDesc','priceAsc','qtyDesc','qtyAsc'] as const).map(k => (
            <Button size='mini' key={k} onClick={() => { setListSortKey(k); setListPage(1) }} type={listSortKey===k?'primary':'default'}>{k}</Button>
          ))}
          <Input style={{ width: '160px' }} value={listKeyword} onInput={e => { setListKeyword(e.detail.value); setListPage(1) }} placeholder='搜索(标题/等级/单价/数量)' />
          <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['export']?.remain === 0)} onClick={() => {
            if (!markAction('export')) return
            const rows = viewListings.map(l => `${l.id},${l.qingtuan.level},${l.qingtuan.amount},${l.unitPrice},${l.minPrice},${new Date((l as any).createdAt).toLocaleString()},${(l.title||'').replace(/,/g,';')}`)
            const csv = ['id,level,amount,unitPrice,minPrice,createdAt,title', ...rows].join('\n')
            setClipboardData({ data: csv })
            showToast({ title: '挂单CSV已复制' })
          }}>导出CSV</Button>
          <Text style={{ color: '#6b7280' }}>剩余{quotasMap['export']?.remain ?? 0}{risk.blockedUntil > Date.now() ? '（封禁中）' : (quotasMap['export']?.remain === 0 ? '（配额用尽）' : '')}</Text>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input style={{ width: '120px' }} type='number' value={batchNewPrice === '' ? '' : String(batchNewPrice)} onInput={e => setBatchNewPrice(e.detail.value ? Number(e.detail.value) : '')} placeholder='批量改价' />
          <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0) || selectedListingIds.length===0 || batchNewPrice===''} onClick={() => {
            const newP = Number(batchNewPrice)
            // 校验选中列表中所有等级的阈值
            for (const l of myListings.filter(x => selectedListingIds.includes(x.id))) {
              const lvl = l.qingtuan.level
              const minP = BASE_QINGTUAN_PRICE[lvl]
              const maxP = MAX_QINGTUAN_PRICE[lvl]
              if (newP < minP) { showToast({ title: `单价不得低于${minP}`, icon: 'error' }); return }
              if (newP > maxP) { showToast({ title: `单价不得高于${maxP}`, icon: 'error' }); return }
            }
            selectedListingIds.forEach(id => updateListingPrice(id, newP))
            showToast({ title: '批量改价完成' })
          }}>批量改价</Button>
          <Text style={{ color: '#6b7280' }}>剩余{quotasMap['list']?.remain ?? 0}{risk.blockedUntil > Date.now() ? '（封禁中）' : (quotasMap['list']?.remain === 0 ? '（配额用尽）' : '')}</Text>
          <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0) || selectedListingIds.length===0} onClick={() => { selectedListingIds.forEach(id => cancelListing(id)); setSelectedListingIds([]); showToast({ title: '批量撤销挂牌完成' }) }}>批量撤单</Button>
        </View>
        {listPageItems.length === 0 ? (
          <View className='empty'>暂无挂单</View>
        ) : (
          listPageItems.map(l => (
            <View key={l.id} className='card'>
              <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Checkbox checked={selectedListingIds.includes(l.id)} onClick={() => setSelectedListingIds(arr => arr.includes(l.id) ? arr.filter(x=>x!==l.id) : [...arr, l.id])} />
                <Text>{l.title || `等级${l.qingtuan.level} 青团 x${l.qingtuan.amount}`}</Text>
              </View>
              <View>单价：{l.unitPrice}（最低价：{l.minPrice}）</View>
              <View style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button type='warn' disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0)} onClick={() => cancelListing(l.id)}>撤单</Button>
                <Text style={{ color: '#6b7280' }}>剩余{quotasMap['list']?.remain ?? 0}{risk.blockedUntil > Date.now() ? '（封禁中）' : (quotasMap['list']?.remain === 0 ? '（配额用尽）' : '')}</Text>
                <Input style={{ width: '120px' }} type='number' value={String(priceEdits[l.id] ?? l.unitPrice)} onInput={e => setPriceEdits(m => ({ ...m, [l.id]: Number(e.detail.value) }))} placeholder='新单价' />
                <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['list']?.remain === 0)} onClick={() => {
                  const newP = priceEdits[l.id] ?? l.unitPrice
                  const lvl = l.qingtuan.level
                  const minP = BASE_QINGTUAN_PRICE[lvl]
                  const maxP = MAX_QINGTUAN_PRICE[lvl]
                  if (newP < minP) { showToast({ title: `单价不得低于${minP}`, icon: 'error' }); return }
                  if (newP > maxP) { showToast({ title: `单价不得高于${maxP}`, icon: 'error' }); return }
                  updateListingPrice(l.id, newP)
                }}>改价</Button>
              </View>
            </View>
          ))
        )}
        <View style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button size='mini' disabled={bidPage<=1} onClick={() => setBidPage(p => Math.max(1, p-1))}>上一页</Button>
          <Text>{bidPage}/{bidTotalPages}</Text>
          <Button size='mini' disabled={bidPage>=bidTotalPages} onClick={() => setBidPage(p => Math.min(bidTotalPages, p+1))}>下一页</Button>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：余额{player.balance}，我的买单{bids.filter(b=>b.buyerId===player.id).length}条，我的挂牌{listings.filter(l=>l.sellerId===player.id).length}条，总交易{transactions.length}条</Text>
        </View>
      </View>
    </View>
  )
}
