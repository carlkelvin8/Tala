import { RoleType } from "@prisma/client"
import { userRepository } from "../repositories/userRepository.js"
import { hashPassword } from "../lib/password.js"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createUser(data: {
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

  await logAudit("CREATE", "User", user.id)
  return user
}

export async function listUsers(filters: { role?: RoleType; search?: string }, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.role) {
    where.role = filters.role
  }
  if (filters.search) {
    where.email = { contains: filters.search, mode: "insensitive" }
  }
  const [items, total] = await Promise.all([
    userRepository.list(where, skip, take),
    userRepository.count(where)
  ])
  return { items, total }
}

export async function updateUser(id: string, data: { role?: RoleType; isActive?: boolean }) {
  const user = await userRepository.update(id, data)
  await logAudit("UPDATE", "User", id)
  return user
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
          section: true,
          flight: true
        }
      },
      implementorProfile: true,
      cadetOfficerProfile: true
    }
  })
  return user
}
