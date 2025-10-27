import React, { useState } from 'react'
import { View, Text, Picker, Button } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useGame } from '../../store/game'
import './index.scss'

export default function Feed() {
  const { pandas, foods, feedPanda } = useGame()
  const [pandaIdx, setPandaIdx] = useState(0)
  const [foodIdx, setFoodIdx] = useState(0)

  useLoad(() => {
    console.log('Feed loaded')
  })

  return (
    <View className='feed'>
      <Text>喂养中心：选择食物喂养大熊猫</Text>
      <View style={{ marginTop: '12px' }}>
        <Picker mode='selector' range={pandas.map(p => p.name)} onChange={e => setPandaIdx(Number(e.detail.value))}>
          <View>选择熊猫：{pandas[pandaIdx]?.name}</View>
        </Picker>
      </View>
      <View style={{ marginTop: '12px' }}>
        <Picker mode='selector' range={foods.map(f => `${f.name}(品质${f.quality})`)} onChange={e => setFoodIdx(Number(e.detail.value))}>
          <View>选择食物：{foods[foodIdx]?.name}</View>
        </Picker>
      </View>
      <View style={{ marginTop: '12px' }}>
        <Button onClick={() => feedPanda(pandas[pandaIdx].id, foods[foodIdx].id)}>喂养</Button>
      </View>
    </View>
  )
}
