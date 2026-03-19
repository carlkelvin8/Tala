// Import the RoleType enum from Prisma for role-based branching logic
import { RoleType } from "@prisma/client"
// Import the user repository for database access to user records
import { userRepository } from "../repositories/userRepository.js"
// Import the password hashing utility
import { hashPassword } from "../lib/password.js"
// Import the Prisma client for direct queries to role-specific profile tables
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record user management events
import { logAudit } from "./auditService.js"

/* Create a new user account and the appropriate role-specific profile (admin use) */
export async function createUser(data: {
  email: string     // The user's email address (must be unique)
  password: string  // Plain-text password (will be hashed before storage)
  role: RoleType    // The role to assign to the new user
  firstName: string // First name for the role profile
  lastName: string  // Last name for the role profile
}) {
  // Check if an account with this email already exists
  const existing = await userRepository.findByEmail(data.email)
  if (existing) {
    throw new Error("Email already in use") // Reject duplicate email registrations
  }
  // Hash the plain-text password using bcrypt before storing it
  const passwordHash = await hashPassword(data.password)
  // Create the base user record with email, hashed password, and role
  const user = await userRepository.create({
    email: data.email,
    passwordHash,
    role: data.role
  })

  // Create the role-specific profile record based on the assigned role
  if (data.role === RoleType.STUDENT) {
    // Create a student profile with name fields
    await prisma.studentProfile.create({
      data: { userId: user.id, firstName: data.firstName, lastName: data.lastName }
    })
  }
  if (data.role === RoleType.IMPLEMENTOR) {
    // Create an implementor profile with name fields
    await prisma.implementorProfile.create({
      data: { userId: user.id, firstName: data.firstName, lastName: data.lastName }
    })
  }
  if (data.role === RoleType.CADET_OFFICER) {
    // Create a cadet officer profile with name fields
    await prisma.cadetOfficerProfile.create({
      data: { userId: user.id, firstName: data.firstName, lastName: data.lastName }
    })
  }

  // Log the user creation event to the audit trail
  await logAudit("CREATE", "User", user.id)
  // Return the created user record (without the password hash)
  return user
}

/* Return a paginated list of users with optional role and search filters */
export async function listUsers(filters: { role?: RoleType; search?: string }, skip: number, take: number) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add role filter if provided
  if (filters.role) {
    where.role = filters.role
  }
  // Add email search filter if provided (case-insensitive partial match)
  if (filters.search) {
    where.email = { contains: filters.search, mode: "insensitive" }
  }
  // Run the count and data queries in parallel for performance
  const [items, total] = await Promise.all([
    // Fetch the paginated user records
    userRepository.list(where, skip, take),
    // Count the total number of matching users for pagination metadata
    userRepository.count(where)
  ])
  // Return both the page of items and the total count
  return { items, total }
}

/* Update a user's role and/or active status */
export async function updateUser(id: string, data: { role?: RoleType; isActive?: boolean }) {
  // Delegate to the repository to update the user record
  const user = await userRepository.update(id, data)
  // Log the user update event to the audit trail
  await logAudit("UPDATE", "User", id)
  // Return the updated user object
  return user
}

/* Fetch a single user by ID with all role-specific profile relations included */
export async function getUserById(id: string) {
  // Fetch the user with all possible profile relations included
  const user = await prisma.user.findUnique({
    where: { id }, // Target the specific user by ID
    include: {
      studentProfile: {
        include: {
          section: true, // Include the student's assigned section
          flight: true   // Include the student's assigned flight
        }
      },
      implementorProfile: true,   // Include the implementor profile if applicable
      cadetOfficerProfile: true   // Include the cadet officer profile if applicable
    }
  })
  // Return the user object (or null if not found)
  return user
}
