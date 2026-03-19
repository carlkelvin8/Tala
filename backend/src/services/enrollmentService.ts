// Import the EnrollmentStatus enum from Prisma for type-safe status values
import { EnrollmentStatus } from "@prisma/client"
// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record enrollment events
import { logAudit } from "./auditService.js"

/* Create a new enrollment record for a user */
export async function createEnrollment(data: { userId: string; sectionId?: string; flightId?: string }) {
  // Insert a new enrollment record with the provided user, section, and flight IDs
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: data.userId,       // Link to the user being enrolled
      sectionId: data.sectionId, // Optional section assignment (may be null)
      flightId: data.flightId    // Optional flight assignment (may be null)
    }
  })
  // Log the enrollment creation event to the audit trail
  await logAudit("CREATE", "Enrollment", enrollment.id)
  // Return the created enrollment record
  return enrollment
}

/* Update the status of an existing enrollment (approve or reject) */
export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus) {
  // Update the enrollment's status field
  const enrollment = await prisma.enrollment.update({
    where: { id }, // Target the specific enrollment by ID
    data: { status } // Set the new status value
  })
  // Log the status update event to the audit trail
  await logAudit("UPDATE", "Enrollment", id)
  // Return the updated enrollment record
  return enrollment
}

/* Return a paginated list of enrollments with optional filters */
export async function listEnrollments(filters: {
  status?: EnrollmentStatus // Optional status filter
  sectionId?: string        // Optional section ID filter
  flightId?: string         // Optional flight ID filter
  search?: string           // Optional free-text search (matches email or user ID)
}, skip: number, take: number) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add status filter if provided
  if (filters.status) where.status = filters.status
  // Add section ID filter if provided
  if (filters.sectionId) where.sectionId = filters.sectionId
  // Add flight ID filter if provided
  if (filters.flightId) where.flightId = filters.flightId
  // Add search filter if a non-empty search string is provided
  if (filters.search && filters.search.trim()) {
    // Use OR to match either the user's email or the user's ID
    where.OR = [
      {
        user: {
          email: { contains: filters.search.trim(), mode: "insensitive" } // Case-insensitive email match
        }
      },
      {
        userId: { contains: filters.search.trim(), mode: "insensitive" } // Case-insensitive user ID match
      }
    ]
  }
  // Run the count and data queries in parallel for performance
  const [items, total] = await Promise.all([
    // Fetch the paginated enrollment records with related user, section, and flight data
    prisma.enrollment.findMany({
      where,  // Apply the dynamic filter
      skip,   // Skip records for previous pages
      take,   // Limit to the page size
      include: {
        user: {
          select: {
            id: true,    // User's unique ID
            email: true, // User's email address
            role: true,  // User's assigned role
            studentProfile: {
              select: {
                firstName: true,  // Student's first name
                lastName: true,   // Student's last name
                studentNo: true   // Student's student number
              }
            }
          }
        },
        section: true, // Include the full section object
        flight: true   // Include the full flight object
      },
      orderBy: { createdAt: "desc" } // Most recently created enrollments first
    }),
    // Count the total number of matching enrollments for pagination metadata
    prisma.enrollment.count({ where })
  ])
  // Return both the page of items and the total count
  return { items, total }
}
