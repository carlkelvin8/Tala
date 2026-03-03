import { Hono } from "hono"
import { login, logout, profile, refresh, register, updateAvatar, removeAvatar, updateAvatarFrame, updatePassword, updateProfile } from "../controllers/authController.js"
import { validateBody } from "../middlewares/zod.js"
import { authMiddleware } from "../middlewares/auth.js"
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from "../validators/auth.js"

export const authRoutes = new Hono()

authRoutes.post("/register", validateBody(registerSchema), register)
authRoutes.post("/login", validateBody(loginSchema), login)
authRoutes.post("/refresh", validateBody(refreshSchema), refresh)
authRoutes.post("/logout", logout)
authRoutes.get("/profile", authMiddleware, profile)
authRoutes.patch("/profile", authMiddleware, updateProfile)
authRoutes.post("/change-password", authMiddleware, validateBody(changePasswordSchema), updatePassword)
authRoutes.patch("/avatar", authMiddleware, updateAvatar)
authRoutes.delete("/avatar", authMiddleware, removeAvatar)
authRoutes.patch("/avatar-frame", authMiddleware, updateAvatarFrame)
