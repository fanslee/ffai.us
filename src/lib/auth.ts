import { supabaseClient } from './supabaseClient'

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabaseClient.auth.getSession()
    return data.session?.access_token || null
  } catch {
    return null
  }
}

export type AuthInfo = { loggedIn: boolean; email?: string; emailVerified?: boolean; phone?: string; phoneVerified?: boolean }

export async function getUserInfo(): Promise<AuthInfo> {
  try {
    const token = await getAccessToken()
    if (!token) return { loggedIn: false }
    const { data } = await supabaseClient.auth.getUser()
    const user = data.user
    if (!user) return { loggedIn: false }
    const email = user.email || undefined
    const emailVerified = !!user.email_confirmed_at
    const phone = (user.phone as any) || undefined
    const phoneVerified = !!user.phone_confirmed_at
    return { loggedIn: true, email, emailVerified, phone, phoneVerified }
  } catch {
    return { loggedIn: false }
  }
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: !!data.session }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'login failed' }
  }
}

export async function signUp(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: !!data.user }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'signup failed' }
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'reset failed' }
  }
}

export async function resendEmailVerification(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient.auth.resend({ type: 'signup', email })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'resend failed' }
  }
}

export async function updateEmail(newEmail: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ email: newEmail })
    if (error) return { ok: false, error: error.message }
    return { ok: !!data.user }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'update email failed' }
  }
}

export async function updatePhone(newPhone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ phone: newPhone as any })
    if (error) return { ok: false, error: error.message }
    return { ok: !!data.user }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'update phone failed' }
  }
}

export async function sendPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient.auth.signInWithOtp({ phone, options: { channel: 'sms' } })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send otp failed' }
  }
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.auth.verifyOtp({ phone, token, type: 'sms' as any })
    if (error) return { ok: false, error: error.message }
    return { ok: !!data.session || !!data.user }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'verify otp failed' }
  }
}

export async function updatePassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: error.message }
    return { ok: !!data.user }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'update password failed' }
  }
}

export async function logout(): Promise<void> {
  try { await supabaseClient.auth.signOut() } catch {}
}
