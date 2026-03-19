// Import the RoleType enum from Prisma for role-based branching logic
import { RoleType } from "@prisma/client"
// Import the user repository for database access to user records
import { userRepository } from "../repositories/userRepository.js"
// Import the password utilities for hashing and verification
import { hashPassword, verifyPassword } from "../lib/password.js"
// Import the JWT signing helpers to generate access and refresh tokens
import { signAccessToken, signRefreshToken } from "../lib/jwt.js"
// Import the Prisma client for direct queries to role-specific profile tables
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record significant actions
import { logAudit } from "./auditService.js"

/* Register a new user account and create the appropriate role-specific profile */
export async function registerUser(data: {
  email: string       // The user's email address (must be unique)
  password: string    // Plain-text password (will be hashed before storage)
  role: RoleType      // The role to assign to the new user
  firstName: string   // First name for the role profile
  lastName: string    // Last name for the role profile
  studentNo?: string  // Optional student number (only relevant for STUDENT role)
}) {
  // Check if an account with this email already exists
  const existing = await userRepository.findByEmail(data.email)
  if (existing) {
    throw new Error("Email already in use") // Reject duplicate email registrations
  }

  // Check if student number is already in use (for students only)
  if (data.role === RoleType.STUDENT && data.studentNo) {
    // Look up the student profile by student number
    const existingStudent = await prisma.studentProfile.findUnique({
      where: { studentNo: data.studentNo }
    })
    if (existingStudent) {
      throw new Error("Student number already in use") // Reject duplicate student numbers
    }
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
    // Create a student profile with name and optional student number
    await prisma.studentProfile.create({
      data: { 
        userId: user.id,          // Link to the newly created user
        firstName: data.firstName, // Student's first name
        lastName: data.lastName,   // Student's last name
        studentNo: data.studentNo  // Optional student number
      }
    })
    // Create an initial PENDING enrollment record for the new student
    await prisma.enrollment.create({
      data: { 
        userId: user.id,   // Link to the newly created user
        status: "PENDING"  // New students start with a pending enrollment
      }
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
  await logAudit("CREATE", "User", user.id, user.id)

  // Return the created user record (without the password hash)
  return user
}

/* Authenticate a user by email or student number and return JWT tokens */
export async function loginUser(emailOrStudentNo: string, password: string) {
  console.log('Login attempt:', { emailOrStudentNo, password }) // Debug log for login attempts
  
  // Try to find user by email first
  let user = await userRepository.findByEmail(emailOrStudentNo)
  
  // If not found and looks like a student number, try finding by student number
  if (!user) {
    // Look up the student profile by student number and include the associated user
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentNo: emailOrStudentNo },
      include: { user: true } // Include the parent user record
    })
    if (studentProfile) {
      user = studentProfile.user // Use the user linked to the student profile
    }
  }
  
  console.log('User found:', user ? 'Yes' : 'No') // Debug log for user lookup result
  if (!user) {
    throw new Error("Invalid credentials") // Generic error to prevent user enumeration
  }
  console.log('Verifying password...') // Debug log before password verification
  // Compare the provided plain-text password against the stored bcrypt hash
  const isValid = await verifyPassword(password, user.passwordHash)
  console.log('Password valid:', isValid) // Debug log for password verification result
  if (!isValid) {
    throw new Error("Invalid credentials") // Generic error to prevent credential enumeration
  }
  if (!user.isActive) {
    throw new Error("Account disabled") // Reject login attempts for deactivated accounts
  }
  // Build the JWT payload with the user's ID and role
  const payload = { sub: user.id, role: user.role }
  // Sign a short-lived access token
  const accessToken = signAccessToken(payload)
  // Sign a long-lived refresh token
  const refreshToken = signRefreshToken(payload)
  // Log the login event to the audit trail
  await logAudit("LOGIN", "User", user.id, user.id)
  // Return the user record and both tokens
  return { user, accessToken, refreshToken }
}

/* Change a user's password after verifying the current password */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  // Look up the user by ID to get their current password hash
  const user = await userRepository.findById(userId)
  if (!user) {
    throw new Error("User not found") // Should not happen if called from an authenticated route
  }
  // Verify the provided current password against the stored hash
  const isValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!isValid) {
    throw new Error("Invalid current password") // Reject if the current password is wrong
  }
  // Hash the new password before storing it
  const passwordHash = await hashPassword(newPassword)
  // Update the user's password hash in the database
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  // Log the password change event to the audit trail
  await logAudit("UPDATE", "UserPassword", userId, userId)
}

/* Update the authenticated user's role-specific profile fields */
export async function updateProfile(userId: string, data: {
  firstName?: string  // Optional new first name
  lastName?: string   // Optional new last name
  middleName?: string // Optional new middle name (students only)
  contactNo?: string  // Optional new contact number
  address?: string    // Optional new address (students only)
  birthDate?: string  // Optional new birth date as ISO string (students only)
  gender?: string     // Optional new gender (students only)
}) {
  // Look up the user to determine which profile table to update
  const user = await userRepository.findById(userId)
  if (!user) {
    throw new Error("User not found") // Should not happen if called from an authenticated route
  }

  // Update the appropriate profile based on role
  if (user.role === RoleType.STUDENT) {
    // Update the student profile with all provided fields
    await prisma.studentProfile.update({
      where: { userId }, // Target the profile linked to this user
      data: {
        firstName: data.firstName,                                          // Update first name if provided
        lastName: data.lastName,                                            // Update last name if provided
        middleName: data.middleName,                                        // Update middle name if provided
        contactNo: data.contactNo,                                          // Update contact number if provided
        address: data.address,                                              // Update address if provided
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,  // Convert ISO string to Date if provided
        gender: data.gender,                                                // Update gender if provided
      }
    })
  } else if (user.role === RoleType.IMPLEMENTOR) {
    // Update the implementor profile with the subset of fields it supports
    await prisma.implementorProfile.update({
      where: { userId }, // Target the profile linked to this user
      data: {
        firstName: data.firstName,  // Update first name if provided
        lastName: data.lastName,    // Update last name if provided
        contactNo: data.contactNo,  // Update contact number if provided
      }
    })
  } else if (user.role === RoleType.CADET_OFFICER) {
    // Update the cadet officer profile with the subset of fields it supports
    await prisma.cadetOfficerProfile.update({
      where: { userId }, // Target the profile linked to this user
      data: {
        firstName: data.firstName,  // Update first name if provided
        lastName: data.lastName,    // Update last name if provided
        contactNo: data.contactNo,  // Update contact number if provided
      }
    })
  }

  // Log the profile update event to the audit trail
  await logAudit("UPDATE", "UserProfile", userId, userId)
}
