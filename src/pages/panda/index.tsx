import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Panda() {
  useLoad(() => {
    console.log('Panda loaded')
  })

  return (
    <View className='panda'>
      <Text>选择你的大熊猫</Text>
    </View>
  )
}
