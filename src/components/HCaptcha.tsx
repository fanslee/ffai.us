import React, { useEffect, useRef, useState } from 'react'

const HCaptcha: React.FC<{ sitekey?: string; onVerify: (token: string) => void }> = ({ sitekey, onVerify }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [widgetId, setWidgetId] = useState<any>(null)
  const key = sitekey || (import.meta as any).env?.VITE_HCAPTCHA_SITEKEY

  useEffect(() => {
    if (!key) return
    const ensureScript = () => new Promise<void>((resolve) => {
      if ((window as any).hcaptcha) return resolve()
      const s = document.createElement('script')
      s.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      document.head.appendChild(s)
    })

    ensureScript().then(() => {
      const hc = (window as any).hcaptcha
      if (!hc || !containerRef.current) return
      const id = hc.render(containerRef.current, {
        sitekey: key,
        callback: (token: string) => { onVerify(token) },
      })
      setWidgetId(id)
    })

    return () => {
      try {
        const hc = (window as any).hcaptcha
        if (hc && widgetId !== null) hc.remove(widgetId)
      } catch {}
    }
  }, [key])

  return (
    <div style={{ marginTop: 8 }}>
      {!key && <div style={{ color: '#ef4444' }}>未配置 hCaptcha sitekey（VITE_HCAPTCHA_SITEKEY），验证码暂不可用。</div>}
      <div ref={containerRef} />
    </div>
  )
}

export default HCaptcha
