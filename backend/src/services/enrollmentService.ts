import { EnrollmentStatus } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function createEnrollment(data: { userId: string; sectionId?: string; flightId?: string }) {
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: data.userId,
      sectionId: data.sectionId,
      flightId: data.flightId
    }
  })
  await logAudit("CREATE", "Enrollment", enrollment.id)
  return enrollment
}

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus) {
  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: { status }
  })
  await logAudit("UPDATE", "Enrollment", id)
  return enrollment
}

export async function listEnrollments(filters: {
  status?: EnrollmentStatus
  sectionId?: string
  flightId?: string
  search?: string
}, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.status) where.status = filters.status
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  if (filters.search && filters.search.trim()) {
    where.OR = [
      {
        user: {
          email: { contains: filters.search.trim(), mode: "insensitive" }
        }
      },
      {
        userId: { contains: filters.search.trim(), mode: "insensitive" }
      }
    ]
  }
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: {
              select: {
                firstName: true,
                lastName: true,
                studentNo: true
              }
            }
          }
        },
        section: true,
        flight: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.enrollment.count({ where })
  ])
  return { items, total }
}
