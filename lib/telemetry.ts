import { PostHog } from 'posthog-node'

const key = process.env.POSTHOG_KEY
const host = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com'

let client: PostHog | null = null
if (key) {
  client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 })
}

type Props = Record<string, any>

export function captureServer(event: string, properties: Props = {}) {
  try {
    if (!client) return
    const { distinct_id, ...rest } = properties
    client.capture({
      distinctId: distinct_id ?? 'server',
      event,
      properties: {
        ...rest,
        $source: 'server',
        vercel_env: process.env.VERCEL_ENV,
        vercel_url: process.env.VERCEL_URL,
      },
    })
  } catch {
    // no-op: nunca romper la request por telemetría
  }
}
