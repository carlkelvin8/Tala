// Import the Hono router class to create a modular sub-router for auth endpoints
import { Hono } from "hono"
// Import all authentication controller functions
import { login, logout, profile, refresh, register, updateAvatar, removeAvatar, updateAvatarFrame, updatePassword, updateProfile } from "../controllers/authController.js"
// Import the body validation middleware factory
import { validateBody } from "../middlewares/zod.js"
// Import the authentication middleware to protect private routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the Zod schemas used to validate auth request bodies
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from "../validators/auth.js"

// Create a new Hono sub-router for all /api/auth/* routes
export const authRoutes = new Hono()

// POST /api/auth/register — validate body then call the register controller
authRoutes.post("/register", validateBody(registerSchema), register)
// POST /api/auth/login — validate body then call the login controller
authRoutes.post("/login", validateBody(loginSchema), login)
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
