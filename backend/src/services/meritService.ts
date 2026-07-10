// Import the MeritType enum from Prisma for type-safe merit/demerit type values
import { MeritType } from "@prisma/client"
// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record merit/demerit events
import { logAudit } from "./auditService.js"

/* Assign a merit or demerit to a student */
export async function assignMerit(data: {
  studentId: string    // UUID of the student receiving the merit/demerit
  type: MeritType      // Whether this is a MERIT or DEMERIT
  points: number       // Point value (positive for merits, negative for demerits)
  reason: string       // Mandatory justification text
  encodedById: string  // UUID of the staff member assigning the merit/demerit
}) {
  // Insert a new merit/demerit record with the provided data
  const merit = await prisma.meritDemerit.create({ data })
  // Log the merit/demerit assignment event to the audit trail with the encoder's ID
  await logAudit("CREATE", "MeritDemerit", merit.id, data.encodedById)
  // Return the created merit/demerit object
  return merit
}

export async function listMerits(filters: { studentId?: string; type?: MeritType; sectionId?: string }, skip: number, take: number) {
  const where: Record<string, unknown> = {}
  if (filters.studentId) where.studentId = filters.studentId
  if (filters.type) where.type = filters.type
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }
  const [items, total] = await Promise.all([
    prisma.meritDemerit.findMany({
      where,
      skip,
      take,
      include: { student: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.meritDemerit.count({ where })
  ])
  return { items, total }
}
