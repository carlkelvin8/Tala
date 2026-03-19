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

/* Return a paginated list of merit/demerit records with optional filters */
export async function listMerits(filters: { studentId?: string; type?: MeritType }, skip: number, take: number) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add student ID filter if provided
  if (filters.studentId) where.studentId = filters.studentId
  // Add type filter (MERIT or DEMERIT) if provided
  if (filters.type) where.type = filters.type
  // Run the count and data queries in parallel for performance
  const [items, total] = await Promise.all([
    // Fetch the paginated merit/demerit records with the student's user data included
    prisma.meritDemerit.findMany({
      where,                       // Apply the dynamic filter
      skip,                        // Skip records for previous pages
      take,                        // Limit to the page size
      include: { student: true },  // Include the full student user object
      orderBy: { createdAt: "desc" } // Most recently created records first
    }),
    // Count the total number of matching records for pagination metadata
    prisma.meritDemerit.count({ where })
  ])
  // Return both the page of items and the total count
  return { items, total }
}
