import jwt, { type Secret, type SignOptions } from "jsonwebtoken"
import { env } from "./env.js"
import { RoleType } from "@prisma/client"

export type JwtPayload = {
  sub: string
  role: RoleType
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.accessTokenSecret as Secret, { expiresIn: env.accessTokenExpiresIn as SignOptions["expiresIn"] })
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, env.refreshTokenSecret as Secret, { expiresIn: env.refreshTokenExpiresIn as SignOptions["expiresIn"] })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessTokenSecret as Secret) as JwtPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshTokenSecret as Secret) as JwtPayload
}
