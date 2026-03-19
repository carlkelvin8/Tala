// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"

/* Fetch enrollment records for reporting, with optional date range and scope filters */
export async function enrollmentReport(filters: { from?: Date; to?: Date; sectionId?: string; flightId?: string }) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add section ID filter if provided
  if (filters.sectionId) where.sectionId = filters.sectionId
  // Add flight ID filter if provided
  if (filters.flightId) where.flightId = filters.flightId
  
  // Only add date filter if both from and to are provided, or if either is provided
  if (filters.from || filters.to) {
    // Build the date range filter object
    const dateFilter: Record<string, Date> = {}
    // Add the lower bound if a 'from' date was provided
    if (filters.from) dateFilter.gte = filters.from
    if (filters.to) {
      // Set to end of day for 'to' date so the entire day is included
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999) // Set time to 23:59:59.999 to include the full day
      dateFilter.lte = toDate // Add the upper bound
    }
    // Apply the date range filter to the createdAt field
    where.createdAt = dateFilter
  }
  
  // Fetch enrollment records with related user, section, and flight data
  return prisma.enrollment.findMany({ 
    where, // Apply the dynamic filter
    include: { 
      user: {
        select: {
          id: true,    // User's unique ID
          email: true, // User's email address
          role: true,  // User's assigned role
          studentProfile: {
            select: {
              firstName: true, // Student's first name
              lastName: true   // Student's last name
            }
          }
        }
      }, 
      section: true, // Include the full section object
      flight: true   // Include the full flight object
    },
    orderBy: { createdAt: 'desc' } // Most recently created enrollments first
  })
}

/* Convert an array of flat objects to a CSV string */
export function toCsv(rows: Record<string, unknown>[]) {
  // Return an empty string if there are no rows to convert
  if (rows.length === 0) return ""
  
  // Extract the column headers from the keys of the first row object
  const headers = Object.keys(rows[0])
  // Build the CSV lines: first the header row, then one line per data row
  const lines = [
    headers.join(","), // Join header names with commas to form the header row
    ...rows.map((row) => 
      // For each row, map each header to its corresponding value
      headers.map((key) => {
        const value = row[key]
        // Properly escape CSV values
        if (value === null || value === undefined) return "" // Represent null/undefined as empty string
        const str = String(value) // Convert the value to a string
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"` // Escape internal quotes by doubling them
        }
        return str // Return the plain string if no escaping is needed
      }).join(",") // Join the cell values with commas to form the data row
    )
  ]
  // Join all lines with newline characters to form the complete CSV string
  return lines.join("\n")
}
