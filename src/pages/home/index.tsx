import React, { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import { useLoad, navigateTo } from '@tarojs/taro'
import { useGame, getActionQuota } from '../../store/game'
import { getUserInfo } from '../../lib/auth'
import './index.scss'

export default function Home() {
  const { player, risk, recharge, stealFromFriend, exportSave, importSave, resetAll, markAction, pandas, listings, bids, login, logout } = useGame()

  useLoad(() => {
    console.log('Home loaded')
  })

  const [tick, setTick] = useState(0)
  const [authState, setAuthState] = useState<{ loggedIn: boolean; email?: string }>({ loggedIn: false })
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    getUserInfo().then(setAuthState)
    return () => clearInterval(t)
  }, [])
  const quotasMap = React.useMemo(() => {
    const arr = getActionQuota(risk)
    return Object.fromEntries(arr.map(q => [q.key, q])) as Record<string, { used: number; limit: number; remain: number }>
  }, [risk, tick])

  return (
    <View className='home'>
      <Text>大熊猫派对 - 首页</Text>
      <View style={{ marginTop: '12px' }}>
        <Text>青团余额：{player.balance}</Text>
      </View>

      {/* 登录入口移动到“账户”页，这里只显示跳转 */}
      <View style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <Button onClick={() => navigateTo({ url: '/pages/account/index' })}>前往账户页</Button>
      </View>
      <View style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button onClick={() => recharge(10)}>充值 +10</Button>
        <Button disabled={risk.blockedUntil > Date.now() || (quotasMap['steal']?.remain === 0)} onClick={() => stealFromFriend('u2')}>去偷取</Button>
        <Button onClick={() => navigateTo({ url: '/pages/orders/index' })}>我的委托</Button>
        <Button size='mini' disabled={risk.blockedUntil > Date.now() || (quotasMap['export']?.remain === 0)} onClick={() => { if (!markAction('export')) return; const json = exportSave(); if (!json) return; const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob as any); const a = document.createElement('a'); a.href = url; a.download = `CutePartySave_${new Date().toISOString().replace(/[:.]/g,'-')}.json`; a.click(); URL.revokeObjectURL(url) }}>导出存档</Button>
        <Button size='mini' onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'application/json'
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            const text = await file.text()
            importSave(text)
          }
          input.click()
        }}>导入存档</Button>
        <Button size='mini' onClick={() => resetAll()}>一键重置</Button>
        <View style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'marketOnly') }; input.click() }}>仅导入市场数据</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'transactionsOnly') }; input.click() }}>仅导入交易记录</Button>
          <Button size='mini' onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = async () => { const file = input.files?.[0]; if (!file) return; const text = await file.text(); importSaveMerge(text, 'playerOnly') }; input.click() }}>仅导入玩家资产</Button>
        </View>
      </View>

      <View style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #e5e7eb' }}>
        <Text>风控提示</Text>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>状态：{risk.blockedUntil > Date.now() ? `封禁中，剩余${Math.ceil((risk.blockedUntil - Date.now())/1000)}s` : '正常'}</Text>
        </View>
        <View style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {getActionQuota(risk).map(q => (
            <View key={q.key} style={{ padding: '4px 8px', border: '1px solid #eee', borderRadius: '6px' }}>
              <Text>{q.key}: {q.used}/{q.limit}（剩余{q.remain}）</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: '8px', color: '#6b7280' }}>
          <Text>当前概览：熊猫{pandas.length}只，挂牌{listings.length}条，买单{bids.length}条</Text>
        </View>
      </View>
    </View>
  )
}
