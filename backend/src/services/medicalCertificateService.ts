import { MedicalCertificateStatus, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { checkAndMarkAbsences } from "./absenceService.js"

export async function uploadCertificate(userId: string, data: {
  fileName: string
  fileUrl: string
  reason: string
  dateFrom: Date
  dateTo: Date
}) {
  const certificate = await prisma.medicalCertificate.create({
    data: {
      userId,
      ...data,
    },
  })
  await logAudit("CREATE", "MedicalCertificate", certificate.id, userId)
  return certificate
}

export async function reviewCertificate(
  id: string,
  reviewedById: string,
  status: MedicalCertificateStatus,
  remarks?: string
) {
  const existing = await prisma.medicalCertificate.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Medical certificate not found")
  }
  if (existing.status !== "PENDING") {
    throw new Error("Certificate has already been reviewed")
  }

  const updated = await prisma.medicalCertificate.update({
    where: { id },
    data: {
      status,
      reviewedById,
      reviewedAt: new Date(),
      remarks,
    },
  })

  await logAudit("UPDATE", "MedicalCertificate", id, reviewedById, { status, remarks })

  if (status === "APPROVED") {
    const absentRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: existing.userId,
        status: "ABSENT",
        date: {
          gte: existing.dateFrom,
          lte: existing.dateTo,
        },
      },
    })

    if (absentRecords.length > 0) {
      await prisma.attendanceRecord.updateMany({
        where: {
          userId: existing.userId,
          status: "ABSENT",
          date: {
            gte: existing.dateFrom,
            lte: existing.dateTo,
          },
        },
        data: {
          status: "PRESENT",
        },
      })

      await logAudit(
        "UPDATE",
        "AttendanceRecord",
        undefined,
        reviewedById,
        {
          reason: "Medical certificate approved",
          certificateId: id,
          removedAbsences: absentRecords.length,
          dateFrom: existing.dateFrom,
          dateTo: existing.dateTo,
        }
      )

      await checkAndMarkAbsences(existing.userId)
    }
  }

  return updated
}

export async function listCertificates(
  filters: {
    userId?: string
    status?: MedicalCertificateStatus
    search?: string
  },
  skip: number,
  take: number
) {
  const where: Prisma.MedicalCertificateWhereInput = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.status) where.status = filters.status
  if (filters.search) {
    where.OR = [
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
      { reason: { contains: filters.search, mode: "insensitive" } },
      { fileName: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.medicalCertificate.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            studentProfile: { select: { firstName: true, lastName: true, studentNo: true } },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            implementorProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.medicalCertificate.count({ where }),
  ])

  return { items, total }
}

export async function getUserCertificates(userId: string) {
  return prisma.medicalCertificate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}
