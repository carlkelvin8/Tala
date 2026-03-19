// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating a new user via the admin user management endpoint */
export const userCreateSchema = z.object({
  email: z.string().email(),                                                   // Must be a valid email address
  password: z.string().min(8),                                                 // Password must be at least 8 characters
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),         // Must be one of the four valid roles
  firstName: z.string().min(1),                                                // First name must not be empty
  lastName: z.string().min(1)                                                  // Last name must not be empty
})

/* Schema for updating an existing user's role and/or active status */
export const userUpdateSchema = z.object({
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]).optional(), // Optional new role
  isActive: z.boolean().optional()                                                // Optional flag to activate or deactivate the account
})

/* Schema for query parameters when listing users */
export const userQuerySchema = z.object({
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]).optional(), // Filter by role
  search: z.string().optional(),                                                  // Free-text search (matches email)
  page: z.string().optional(),                                                    // Page number for pagination
  pageSize: z.string().optional()                                                 // Items per page for pagination
})
