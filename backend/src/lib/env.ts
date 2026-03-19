// Load environment variables from the .env file into process.env at module load time
import "dotenv/config"

// Export a single validated configuration object used throughout the application
export const env = {
  // Parse the PORT env var as a number; fall back to 4000 if not set
  port: Number(process.env.PORT ?? 4000),
  // Split a comma-separated CORS_ORIGIN string into an array; default to localhost:5173
  corsOrigin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
  // Secret key used to sign and verify short-lived access tokens; has a dev fallback
  accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
  // Secret key used to sign and verify long-lived refresh tokens; has a dev fallback
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
  // Expiry duration for access tokens (e.g. "15m"); defaults to 15 minutes
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  // Expiry duration for refresh tokens (e.g. "7d"); defaults to 7 days
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
}
