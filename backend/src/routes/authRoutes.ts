import { Hono } from "hono"
import { login, logout, profile, refresh, register, updateAvatar, removeAvatar, updateAvatarFrame, updatePassword, updateProfile, forgotPassword, resetPassword } from "../controllers/authController.js"
import { validateBody } from "../middlewares/zod.js"
import { authMiddleware } from "../middlewares/auth.js"
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.js"
import { rateLimitLogin, rateLimitRefresh, rateLimitRegister } from "../middlewares/rateLimit.js"

export const authRoutes = new Hono()

authRoutes.post("/register", rateLimitRegister, validateBody(registerSchema), register)
authRoutes.post("/login", validateBody(loginSchema), rateLimitLogin, login)
authRoutes.post("/refresh", rateLimitRefresh, validateBody(refreshSchema), refresh)
authRoutes.post("/logout", authMiddleware, logout)
authRoutes.get("/profile", authMiddleware, profile)
authRoutes.patch("/profile", authMiddleware, updateProfile)
authRoutes.post("/change-password", authMiddleware, validateBody(changePasswordSchema), updatePassword)
authRoutes.patch("/avatar", authMiddleware, updateAvatar)
authRoutes.delete("/avatar", authMiddleware, removeAvatar)
authRoutes.patch("/avatar-frame", authMiddleware, updateAvatarFrame)
authRoutes.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword)
authRoutes.post("/reset-password", validateBody(resetPasswordSchema), resetPassword)
