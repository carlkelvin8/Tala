import { RoleType } from "@prisma/client"
import { userRepository } from "../repositories/userRepository.js"
import { hashPassword, verifyPassword } from "../lib/password.js"
import { signAccessToken, signRefreshToken } from "../lib/jwt.js"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import jwt from "jsonwebtoken"
import { createHash, randomInt } from "crypto"
import { env } from "../lib/env.js"

/* Register a new user account and create the appropriate role-specific profile */
export async function registerUser(data: {
  email: string
  password: string
  role: RoleType
  firstName: string
  lastName: string
  studentNo?: string
}) {
  const existing = await userRepository.findByEmail(data.email)
  if (existing) {
    throw new Error("Email already in use")
  }

  if (data.role === RoleType.STUDENT && data.studentNo) {
    const existingStudent = await prisma.studentProfile.findUnique({
      where: { studentNo: data.studentNo }
    })
    if (existingStudent) {
      throw new Error("Student number already in use")
    }
  }

  const passwordHash = await hashPassword(data.password)

  // Use a transaction to ensure atomicity of user + profile creation
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email: data.email, passwordHash, role: data.role }
    })

    if (data.role === RoleType.STUDENT) {
      await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          studentNo: data.studentNo
        }
      })
      await tx.enrollment.create({
        data: { userId: newUser.id, status: "PENDING" }
      })
    } else if (data.role === RoleType.IMPLEMENTOR) {
      await tx.implementorProfile.create({
        data: { userId: newUser.id, firstName: data.firstName, lastName: data.lastName }
      })
    } else if (data.role === RoleType.CADET_OFFICER) {
      await tx.cadetOfficerProfile.create({
        data: { userId: newUser.id, firstName: data.firstName, lastName: data.lastName }
      })
    }

    return newUser
  })

  await logAudit("CREATE", "User", user.id, user.id)
  return user
}

/* Authenticate a user by email or student number and return JWT tokens */
export async function loginUser(emailOrStudentNo: string, password: string) {
  let user = await userRepository.findByEmail(emailOrStudentNo)

  if (!user) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentNo: emailOrStudentNo },
      include: { user: true }
    })
    if (studentProfile) {
      user = studentProfile.user
    }
  }

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
  const refreshToken = signRefreshToken({ ...payload, tokenVersion: user.refreshTokenVersion })
  await logAudit("LOGIN", "User", user.id, user.id)
  return { user, accessToken, refreshToken }
}

/* Change a user's password after verifying the current password */
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
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordUpdatedAt: new Date(), refreshTokenVersion: { increment: 1 } }
  })
  await logAudit("UPDATE", "UserPassword", userId, userId)
}

/* Update the authenticated user's role-specific profile fields */
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
  if (!user.isActive) {
    throw new Error("Account is disabled")
  }

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

function hashResetCode(code: string) {
  return createHash("sha256").update(`${code}:${env.accessTokenSecret}`).digest("hex")
}

export async function forgotPassword(email: string) {
  const genericMessage = "If an account exists with this email, a reset code has been generated."
  const user = await userRepository.findByEmail(email)
  if (!user) {
    return { message: genericMessage }
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  const ticket = jwt.sign(
    { sub: user.id, type: "password-reset", codeHash: hashResetCode(code) },
    env.accessTokenSecret,
    { expiresIn: "10m" }
  )
  await logAudit("FORGOT_PASSWORD", "User", user.id, user.id)
  return { message: genericMessage, otp: code, ticket }
}

export async function resetPassword(ticket: string, code: string, newPassword: string) {
  try {
    const payload = jwt.verify(ticket, env.accessTokenSecret) as { sub: string; type: string; codeHash?: string }
    if (payload.type !== "password-reset" || !payload.codeHash) {
      throw new Error("Invalid reset ticket")
    }
    if (hashResetCode(code) !== payload.codeHash) {
      throw new Error("Incorrect verification code")
    }
    const user = await userRepository.findById(payload.sub)
    if (!user) {
      throw new Error("User not found")
    }
    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordUpdatedAt: new Date(), refreshTokenVersion: { increment: 1 } }
    })
    await logAudit("RESET_PASSWORD", "User", user.id, user.id)
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      throw error
    }
    throw new Error("Invalid or expired reset token")
  }
}
