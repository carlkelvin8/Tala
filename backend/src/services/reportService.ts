import { prisma } from "../lib/prisma.js"

export async function enrollmentReport(filters: { from?: Date; to?: Date; sectionId?: string; flightId?: string }) {
  const where: Record<string, unknown> = {}
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  
  // Only add date filter if both from and to are provided, or if either is provided
  if (filters.from || filters.to) {
    const dateFilter: Record<string, Date> = {}
    if (filters.from) dateFilter.gte = filters.from
    if (filters.to) {
      // Set to end of day for 'to' date
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }
    where.createdAt = dateFilter
  }
  
  return prisma.enrollment.findMany({ 
    where, 
    include: { 
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          studentProfile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }, 
      section: true, 
      flight: true 
    },
    orderBy: { createdAt: 'desc' }
  })
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return ""
  
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(","),
    ...rows.map((row) => 
      headers.map((key) => {
        const value = row[key]
        // Properly escape CSV values
        if (value === null || value === undefined) return ""
        const str = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(",")
    )
  ]
  return lines.join("\n")
}
