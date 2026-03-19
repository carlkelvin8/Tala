// Import the AttendanceStatus enum from Prisma for type-safe status values
import { AttendanceStatus } from "@prisma/client"
// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record attendance events
import { logAudit } from "./auditService.js"

// Reusable Prisma select shape for including user data in attendance queries
// Selects only the fields needed for display — avoids exposing the password hash
const userInclude = {
  select: {
    id: true,    // User's unique ID
    email: true, // User's email address
    role: true,  // User's assigned role
    studentProfile: { select: { firstName: true, lastName: true } },       // Student name fields
    implementorProfile: { select: { firstName: true, lastName: true } },   // Implementor name fields
    cadetOfficerProfile: { select: { firstName: true, lastName: true } },  // Cadet officer name fields
  },
} as const // Mark as const to preserve the literal types for Prisma's type inference

/* Record a check-in for a user on today's date */
export async function checkIn(userId: string, latitude: number, longitude: number) {
  // Get the current date and time
  const today = new Date()
  // Normalise to midnight (start of day) to use as the attendance date key
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Upsert: update today's record if it exists, otherwise create a new one
  const record = await prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date } }, // Unique constraint on user + date
    update: { checkInAt: new Date(), latitude, longitude, status: AttendanceStatus.PRESENT }, // Update check-in time and location
    create: { userId, date, checkInAt: new Date(), latitude, longitude, status: AttendanceStatus.PRESENT }, // Create new record if none exists
  })
  // Log the check-in event to the audit trail
  await logAudit("CREATE", "AttendanceRecord", record.id, userId)
  // Return the upserted attendance record
  return record
}

/* Record a check-out for a user on today's date */
export async function checkOut(userId: string, latitude: number, longitude: number) {
  // Get the current date and time
  const today = new Date()
  // Normalise to midnight (start of day) to match the existing attendance record
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Upsert: update today's record with check-out time, or create a new record if none exists
  const record = await prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date } }, // Unique constraint on user + date
    update: { checkOutAt: new Date(), latitude, longitude }, // Update check-out time and location
    create: { userId, date, checkOutAt: new Date(), latitude, longitude }, // Create new record if none exists
  })
  // Log the check-out event to the audit trail
  await logAudit("UPDATE", "AttendanceRecord", record.id, userId)
  // Return the upserted attendance record
  return record
}

/* Return a paginated list of attendance records with optional filters */
export async function listAttendance(
  filters: { date?: Date; userId?: string; sectionId?: string; flightId?: string }, // Optional filter criteria
  skip: number, // Number of records to skip (pagination offset)
  take: number  // Maximum number of records to return (page size)
) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add date filter if provided
  if (filters.date) where.date = filters.date
  // Add user ID filter if provided
  if (filters.userId) where.userId = filters.userId
  // Add section/flight filters via the nested user → studentProfile relation
  if (filters.sectionId || filters.flightId) {
    where.user = {
      studentProfile: {
        sectionId: filters.sectionId, // Filter by the student's assigned section
        flightId: filters.flightId,   // Filter by the student's assigned flight
      },
    }
  }

  // Run the count and data queries in parallel for performance
  const [items, total] = await Promise.all([
    // Fetch the paginated attendance records with user data included
    prisma.attendanceRecord.findMany({
      where,                          // Apply the dynamic filter
      skip,                           // Skip records for previous pages
      take,                           // Limit to the page size
      include: { user: userInclude }, // Include the user's basic info and profile name
      orderBy: { date: "desc" },      // Most recent records first
    }),
    // Count the total number of matching records for pagination metadata
    prisma.attendanceRecord.count({ where }),
  ])
  // Return both the page of items and the total count
  return { items, total }
}
