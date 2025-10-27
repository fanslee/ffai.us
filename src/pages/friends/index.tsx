import React, { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import { useGame } from '../../store/game'
import { STEAL_COOLDOWN_MS } from '../../store/game'
import './index.scss'

export default function Friends() {
  const { stealFromFriend, feedFriend, ...rest } = useGame()
  const cooldowns = (rest as any).stealCooldowns as Record<string, number>
  const friendships = (rest as any).friendships as Record<string, number>
  const friends = [
    { id: 'u2', name: '好友A' },
    { id: 'u3', name: '好友B' },
  ]

  const [tick, setTick] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const now = tick
  const remain = (id: string) => {
    const last = cooldowns?.[id] || 0
    return Math.max(0, STEAL_COOLDOWN_MS - (now - last))
  }

  return (
    <View className='friends'>
      <Text>好友列表</Text>
      {friends.map(f => {
        const r = remain(f.id)
        const sec = Math.ceil(r / 1000)
        const disabled = r > 0
        const intimacy = friendships?.[f.id] || 0
        return (
          <View key={f.id} style={{ marginTop: '8px', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }}>
            <View style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{f.name}</Text>
              <Text style={{ color: '#6b7280' }}>亲密度：{intimacy}</Text>
            </View>
            <View style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <Button disabled={disabled} onClick={() => stealFromFriend(f.id)}>{disabled ? `冷却${sec}s` : '偷取收益'}</Button>
              <Button onClick={() => feedFriend(f.id)}>互喂</Button>
            </View>
          </View>
        )
      })}
    </View>
  )
}
