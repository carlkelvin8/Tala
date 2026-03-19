// Import the shared Prisma client instance for database access
import { prisma } from "../lib/prisma.js"
// Import the RoleType enum from Prisma to type the role field in update operations
import { RoleType } from "@prisma/client"

/* Data-access object for the User model — all direct DB queries for users live here */
export const userRepository = {
  /* Find a single user by their email address; returns null if not found */
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },
  /* Find a single user by their primary key (UUID); returns null if not found */
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },
  /* Create a new user record with the provided credentials and role */
  create(data: {
    email: string                                                    // Unique email address
    passwordHash: string                                             // bcrypt-hashed password
    role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"    // Assigned role
  }) {
    return prisma.user.create({ data })
  },
  /* Update a user's role and/or active status by their ID */
  update(id: string, data: { role?: RoleType; isActive?: boolean }) {
    return prisma.user.update({ where: { id }, data })
  },
  /* Return a paginated, filtered list of users ordered by creation date descending */
  list(where: Record<string, unknown>, skip: number, take: number) {
    return prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
  },
  /* Count the total number of users matching the given filter — used for pagination metadata */
  count(where: Record<string, unknown>) {
    return prisma.user.count({ where })
  }
}
