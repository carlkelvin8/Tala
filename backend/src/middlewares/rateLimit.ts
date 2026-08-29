import type { Context, Next } from "hono"

type Entry = { count: number; resetAt: number }
type KeyResolver = (c: Context) => string | Promise<string>

const stores = new Set<Map<string, Entry>>()

function clientIp(c: Context) {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    || c.req.header("x-real-ip")
    || "unknown"
}

function rateLimit(options: { max: number; windowMs: number; key: KeyResolver }) {
  const store = new Map<string, Entry>()
  stores.add(store)

  return async (c: Context, next: Next) => {
    const now = Date.now()
    const key = await options.key(c)
    const current = store.get(key)
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current

    if (entry.count >= options.max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      c.header("Retry-After", String(retryAfter))
      return c.json({ success: false, message: `Too many requests. Try again in ${retryAfter}s.` }, 429)
    }

    entry.count += 1
    store.set(key, entry)
    await next()
  }
}

export const rateLimitLogin = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  key: async (c) => {
    const body = await c.req.json<{ email?: string }>()
    return `login:${clientIp(c)}:${body.email?.trim().toLowerCase() || "unknown"}`
  },
})

// High enough for shared campus/NAT networks while still bounding automated signup abuse.
export const rateLimitRegister = rateLimit({ max: 30, windowMs: 60 * 60 * 1000, key: (c) => `register:${clientIp(c)}` })
export const rateLimitRefresh = rateLimit({ max: 30, windowMs: 15 * 60 * 1000, key: (c) => `refresh:${clientIp(c)}` })
export const rateLimitScan = rateLimit({ max: 60, windowMs: 60 * 1000, key: (c) => `scan:${clientIp(c)}:${c.get("user")?.id || "anonymous"}` })

// Binds password reset attempts per email+IP so the 6-digit demo code (returned in
// the response while no mail transport is configured) cannot be brute-forced.
export const rateLimitForgotPassword = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  key: async (c) => {
    const body = await c.req.json<{ email?: string }>()
    return `forgot:${clientIp(c)}:${body.email?.trim().toLowerCase() || "unknown"}`
  },
})
export const rateLimitResetPassword = rateLimit({ max: 10, windowMs: 15 * 60 * 1000, key: (c) => `reset:${clientIp(c)}` })

setInterval(() => {
  const now = Date.now()
  for (const store of stores) {
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }
}, 5 * 60 * 1000).unref()
