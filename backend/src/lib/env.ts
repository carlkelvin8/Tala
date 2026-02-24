import "dotenv/config"

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
}
