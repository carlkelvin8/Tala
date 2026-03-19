// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for the user registration request body */
export const registerSchema = z.object({
  email: z.string().email(),                                                    // Must be a valid email address
  password: z.string().min(8),                                                  // Password must be at least 8 characters
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),          // Must be one of the four valid roles
  firstName: z.string().min(1),                                                 // First name must not be empty
  lastName: z.string().min(1),                                                  // Last name must not be empty
  studentNo: z.string().optional()                                              // Student number is optional (only for STUDENT role)
})

/* Schema for the login request body */
export const loginSchema = z.object({
  email: z.string().min(1), // Changed to accept email or student number — just needs to be non-empty
  password: z.string().min(8) // Password must be at least 8 characters
})

/* Schema for the token refresh request body */
export const refreshSchema = z.object({
  refreshToken: z.string().min(10) // Refresh token must be at least 10 characters (basic sanity check)
})

/* Schema for the change-password request body */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8), // Current password must be at least 8 characters
  newPassword: z.string().min(8)      // New password must also be at least 8 characters
})
