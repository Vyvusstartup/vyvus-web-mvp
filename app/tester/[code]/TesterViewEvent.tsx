'use client'
import posthog from 'posthog-js'
import { useEffect } from 'react'

type Props = {
  testerCode: string
  date?: string | null
  mode?: string | null
}

export default function TesterViewEvent({ testerCode, date, mode }: Props) {
  useEffect(() => {
    if (!testerCode) return
    posthog.capture('tester_view', {
      tester_code: testerCode,
      date: date ?? null,
      mode: mode ?? null,
    })
  }, [testerCode, date, mode])

  return null
}
