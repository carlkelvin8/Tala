import { RoleType } from "@prisma/client"
import { userRepository } from "../repositories/userRepository.js"
import { hashPassword, verifyPassword } from "../lib/password.js"
import { signAccessToken, signRefreshToken } from "../lib/jwt.js"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function registerUser(data: {
  email: string
  password: string
  role: RoleType
  firstName: string
  lastName: string
}) {
  const existing = await userRepository.findByEmail(data.email)
  if (existing) {
    throw new Error("Email already in use")
  }
  const passwordHash = await hashPassword(data.password)
  const user = await userRepository.create({
    email: data.email,
    passwordHash,
    role: data.role
  })

  if (data.role === RoleType.STUDENT) {
    await prisma.studentProfile.create({
      data: { userId: user.id, firstName: data.firstName, lastName: data.lastName }
    })
    // Create enrollment record for the student
    await prisma.enrollment.create({
      data: { 
        userId: user.id,
        status: "PENDING"
      }
    })
  }
  if (data.role === RoleType.IMPLEMENTOR) {
    await prisma.implementorProfile.create({
      data: { userId: user.id, firstName: data.firstName, lastName: data.lastName }
    })
  }
  if (data.role === RoleType.CADET_OFFICER) {
    await prisma.cadetOfficerProfile.create({
      data: { userId: user.id, firstName: data.firstName, lastName: data.lastName }
    })
  }

  await logAudit("CREATE", "User", user.id, user.id)

  return user
}

export async function loginUser(email: string, password: string) {
  const user = await userRepository.findByEmail(email)
  if (!user) {
    throw new Error("Invalid credentials")
  }
  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw new Error("Invalid credentials")
  }
  if (!user.isActive) {
    throw new Error("Account disabled")
  }
  const payload = { sub: user.id, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  await logAudit("LOGIN", "User", user.id, user.id)
  return { user, accessToken, refreshToken }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }
  const isValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!isValid) {
    throw new Error("Invalid current password")
  }
  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  await logAudit("UPDATE", "UserPassword", userId, userId)
}


export async function updateProfile(userId: string, data: {
  firstName?: string
  lastName?: string
  middleName?: string
  contactNo?: string
  address?: string
  birthDate?: string
  gender?: string
}) {
  const user = await userRepository.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }

  // Update the appropriate profile based on role
  if (user.role === RoleType.STUDENT) {
    await prisma.studentProfile.update({
      where: { userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        contactNo: data.contactNo,
        address: data.address,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
      }
    })
  } else if (user.role === RoleType.IMPLEMENTOR) {
    await prisma.implementorProfile.update({
      where: { userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        contactNo: data.contactNo,
      }
    })
  } else if (user.role === RoleType.CADET_OFFICER) {
    await prisma.cadetOfficerProfile.update({
      where: { userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        contactNo: data.contactNo,
      }
    })
  }

  await logAudit("UPDATE", "UserProfile", userId, userId)
}
