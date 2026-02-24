import { prisma } from "../lib/prisma.js"
import { RoleType } from "@prisma/client"

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },
  create(data: {
    email: string
    passwordHash: string
    role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"
  }) {
    return prisma.user.create({ data })
  },
  update(id: string, data: { role?: RoleType; isActive?: boolean }) {
    return prisma.user.update({ where: { id }, data })
  },
  list(where: Record<string, unknown>, skip: number, take: number) {
    return prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
  },
  count(where: Record<string, unknown>) {
    return prisma.user.count({ where })
  }
}
