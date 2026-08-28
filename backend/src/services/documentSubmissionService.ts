import { DocumentStatus, DocumentType, NstpType, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import { checkAndMarkAbsences } from "./absenceService.js"

export type CreateSubmissionData = {
  docType: DocumentType
  title: string
  description?: string
  fileName: string
  fileUrl: string
  dateFrom?: Date | null
  dateTo?: Date | null
}

export async function createSubmission(userId: string, data: CreateSubmissionData) {
  const submission = await prisma.documentSubmission.create({
    data: { userId, ...data },
  })
  await logAudit("CREATE", "DocumentSubmission", submission.id, userId, { docType: data.docType, title: data.title })
  return submission
}

export async function reviewSubmission(
  id: string,
  reviewedById: string,
  status: DocumentStatus,
  remarks?: string
) {
  const existing = await prisma.documentSubmission.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Submission not found")
  }
  if (existing.status !== "PENDING") {
    throw new Error("Submission has already been reviewed")
  }

  const updated = await prisma.documentSubmission.update({
    where: { id },
    data: {
      status,
      reviewedById,
      reviewedAt: new Date(),
      remarks,
    },
  })

  await logAudit("UPDATE", "DocumentSubmission", id, reviewedById, { status, remarks })

  if (status === "APPROVED" && existing.dateFrom && existing.dateTo) {
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
          reason: "Document submission approved",
          submissionId: id,
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

export async function listSubmissions(
  filters: {
    userId?: string
    status?: DocumentStatus
    docType?: DocumentType
    program?: NstpType
    search?: string
  },
  skip: number,
  take: number
) {
  const ands: Prisma.DocumentSubmissionWhereInput[] = []

  if (filters.userId) ands.push({ userId: filters.userId })
  if (filters.status) ands.push({ status: filters.status })
  if (filters.docType) ands.push({ docType: filters.docType })
  if (filters.program) {
    ands.push({
      user: {
        OR: [
          { program: filters.program },
          { studentProfile: { section: { course: { nstpType: filters.program } } } },
        ],
      },
    })
  }
  if (filters.search) {
    ands.push({
      OR: [
        { user: { email: { contains: filters.search, mode: "insensitive" } } },
        { user: { studentProfile: { firstName: { contains: filters.search, mode: "insensitive" } } } },
        { user: { studentProfile: { lastName: { contains: filters.search, mode: "insensitive" } } } },
        { title: { contains: filters.search, mode: "insensitive" } },
        { fileName: { contains: filters.search, mode: "insensitive" } },
      ],
    })
  }

  const where: Prisma.DocumentSubmissionWhereInput = ands.length ? { AND: ands } : {}

  const [items, total] = await Promise.all([
    prisma.documentSubmission.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            program: true,
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
    prisma.documentSubmission.count({ where }),
  ])

  return { items, total }
}

export async function getUserSubmissions(userId: string) {
  return prisma.documentSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}