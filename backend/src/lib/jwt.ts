// Import the jsonwebtoken library and its TypeScript types for Secret and SignOptions
import jwt, { type Secret, type SignOptions } from "jsonwebtoken"
// Import the environment config to access token secrets and expiry durations
import { env } from "./env.js"
// Import the RoleType enum from Prisma so the JWT payload is typed to valid roles
import { RoleType } from "@prisma/client"

/* Shape of the data encoded inside every JWT issued by this application */
export type JwtPayload = {
  sub: string   // Subject — the user's unique database ID
  role: RoleType // The user's role (ADMIN, IMPLEMENTOR, CADET_OFFICER, STUDENT)
}

/* Sign a short-lived access token with the payload and the access token secret */
export function signAccessToken(payload: JwtPayload) {
  // jwt.sign encodes the payload, signs it with the secret, and sets the expiry
  return jwt.sign(payload, env.accessTokenSecret as Secret, { expiresIn: env.accessTokenExpiresIn as SignOptions["expiresIn"] })
}

/* Sign a long-lived refresh token with the payload and the refresh token secret */
export function signRefreshToken(payload: JwtPayload) {
  // Uses a separate secret and longer expiry than the access token
  return jwt.sign(payload, env.refreshTokenSecret as Secret, { expiresIn: env.refreshTokenExpiresIn as SignOptions["expiresIn"] })
}

/* Verify and decode an access token; throws if the token is invalid or expired */
export function verifyAccessToken(token: string) {
  // jwt.verify checks the signature and expiry, then returns the decoded payload
  return jwt.verify(token, env.accessTokenSecret as Secret) as JwtPayload
}

/* Verify and decode a refresh token; throws if the token is invalid or expired */
export function verifyRefreshToken(token: string) {
  // Uses the refresh secret — a different key from the access token secret
  return jwt.verify(token, env.refreshTokenSecret as Secret) as JwtPayload
}
