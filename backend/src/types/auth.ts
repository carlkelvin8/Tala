// Import the RoleType enum from Prisma so the role field is constrained to valid values
import { RoleType } from "@prisma/client"

/* Minimal representation of an authenticated user stored in the Hono request context */
export type AuthUser = {
  id: string     // The user's unique database UUID
  role: RoleType // The user's role (ADMIN, IMPLEMENTOR, CADET_OFFICER, or STUDENT)
  email: string  // The user's email address — used for display and audit purposes
}
