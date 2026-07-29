import { Context, Next } from "hono"

const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function rateLimitLogin(c: Context, next: Next) {
  const body = await c.req.json()
  const identifier = body.emailOrStudentNo || "unknown"
  const now = Date.now()
  const record = loginAttempts.get(identifier)

  if (record && now < record.resetAt) {
    if (record.count >= MAX_ATTEMPTS) {
      const remaining = Math.ceil((record.resetAt - now) / 1000)
      return c.json(
        { success: false, message: `Too many login attempts. Try again in ${remaining}s.` },
        429
      )
    }
  } else {
    loginAttempts.set(identifier, { count: 0, resetAt: now + WINDOW_MS })
  }

  const entry = loginAttempts.get(identifier)!
  entry.count++
  loginAttempts.set(identifier, entry)

  await next()
}

// Periodic cleanup of expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of loginAttempts) {
    if (now >= val.resetAt) loginAttempts.delete(key)
  }
}, 5 * 60 * 1000).unref()
