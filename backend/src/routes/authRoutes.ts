import { Hono } from "hono"
import { login, logout, profile, refresh, register, updateAvatar, removeAvatar, updateAvatarFrame, updatePassword, updateProfile } from "../controllers/authController.js"
import { validateBody } from "../middlewares/zod.js"
import { authMiddleware } from "../middlewares/auth.js"
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from "../validators/auth.js"
import { rateLimitLogin } from "../middlewares/rateLimit.js"

export const authRoutes = new Hono()

authRoutes.post("/register", validateBody(registerSchema), register)
authRoutes.post("/login", validateBody(loginSchema), rateLimitLogin, login)
// POST /api/auth/refresh — validate body then issue new token pair
authRoutes.post("/refresh", validateBody(refreshSchema), refresh)
// POST /api/auth/logout — stateless logout (client discards tokens); no auth required
authRoutes.post("/logout", logout)
// GET /api/auth/profile — requires valid JWT; returns the authenticated user's full profile
authRoutes.get("/profile", authMiddleware, profile)
// PATCH /api/auth/profile — requires valid JWT; updates the authenticated user's profile fields
authRoutes.patch("/profile", authMiddleware, updateProfile)
// POST /api/auth/change-password — requires valid JWT and validated body; changes the password
authRoutes.post("/change-password", authMiddleware, validateBody(changePasswordSchema), updatePassword)
// PATCH /api/auth/avatar — requires valid JWT; updates the user's avatar image (base64)
authRoutes.patch("/avatar", authMiddleware, updateAvatar)
// DELETE /api/auth/avatar — requires valid JWT; removes the user's avatar image
authRoutes.delete("/avatar", authMiddleware, removeAvatar)
// PATCH /api/auth/avatar-frame — requires valid JWT; updates the user's avatar frame style
authRoutes.patch("/avatar-frame", authMiddleware, updateAvatarFrame)
