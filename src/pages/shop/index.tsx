import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Shop() {
  useLoad(() => {
    console.log('Shop loaded')
  })

  return (
    <View className='shop'>
      <Text>皮肤商城（直接购买不同等级皮肤）</Text>
    </View>
  )
}
