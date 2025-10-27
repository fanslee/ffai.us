import React, { useEffect, useState } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import { updatePassword } from '../../../lib/auth'
import './index.scss'

export default function ResetPassword() {
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    // Supabase 在重置链接跳转到此页时，已给当前浏览器注入临时会话，直接 updateUser 即可
  }, [])

  const submit = async () => {
    setMsg('')
    if (!pwd1 || !pwd2) { setMsg('请输入两次新密码'); return }
    if (pwd1 !== pwd2) { setMsg('两次输入不一致'); return }
    const { ok, error } = await updatePassword(pwd1)
    setMsg(ok ? '密码已更新，请重新登录' : (error || '更新失败'))
  }

  return (
    <View className='reset'>
      <View className='card'>
        <Text className='title'>重置密码</Text>
        <View className='form'>
          <Input type='password' password placeholder='新密码' value={pwd1} onInput={e => setPwd1((e.detail as any).value)} />
          <Input type='password' password placeholder='确认新密码' value={pwd2} onInput={e => setPwd2((e.detail as any).value)} />
          <Button className='primary' onClick={submit}>提交</Button>
          {msg && <Text className='hint'>{msg}</Text>}
        </View>
      </View>
    </View>
  )
}
