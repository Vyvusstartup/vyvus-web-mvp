'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (key && host) {
      posthog.init(key, { api_host: host, capture_pageview: false })
      ;(window as any).posthog = posthog // para poder probar en la consola
    } else {
      console.warn('PostHog env missing')
    }
  }, [])
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
