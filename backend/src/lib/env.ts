const dotenv = await import("dotenv")
dotenv.config()

const isProduction = process.env.NODE_ENV === "production"

function secret(name: string, developmentFallback: string) {
  const value = process.env[name]
  if (value) {
    if (isProduction && value.length < 32) {
      throw new Error(`${name} must be at least 32 characters in production`)
    }
    return value
  }
  if (isProduction) {
    throw new Error(`${name} environment variable is required in production`)
  }
  return developmentFallback
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? ["http://localhost:5173"],
  accessTokenSecret: secret("JWT_ACCESS_SECRET", "dev-access-secret"),
  refreshTokenSecret: secret("JWT_REFRESH_SECRET", "dev-refresh-secret"),
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  qrTokenSecret: secret("QR_TOKEN_SECRET", "tala-qr-token-secret-dev")
}

if (isProduction && new Set([env.accessTokenSecret, env.refreshTokenSecret, env.qrTokenSecret]).size !== 3) {
  throw new Error("JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and QR_TOKEN_SECRET must be different")
}
