import React, { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import { getUserInfo } from '../../../lib/auth'
import './index.scss'

export default function VerifyCallback() {
  const [msg, setMsg] = useState('正在处理...')
  const [type, setType] = useState<string>('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('type') || ''
      setType(t)
      if (t === 'signup') setMsg('邮箱已验证，您可以返回并登录。')
      else if (t === 'email_change') setMsg('邮箱变更已确认。')
      else if (t === 'recovery') setMsg('即将跳转到重置密码页面...')
      else setMsg('验证已完成。')
      if (t === 'recovery') {
        setTimeout(() => { window.location.assign('/pages/account/reset/index') }, 1200)
      }
    } catch {
      setMsg('处理失败，请重试')
    }
  }, [])

  return (
    <View className='verify'>
      <View className='card'>
        <Text className='title'>邮箱验证</Text>
        <Text className='hint'>{msg}</Text>
        <Button className='primary' onClick={() => window.location.assign('/pages/account/index')}>返回账户页</Button>
      </View>
    </View>
  )
}
