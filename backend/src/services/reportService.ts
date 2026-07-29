import { prisma } from "../lib/prisma.js"

/* Fetch enrollment records for reporting, with optional date range and scope filters */
export async function enrollmentReport(filters: { from?: Date; to?: Date; sectionId?: string; flightId?: string }) {
  const where: Record<string, unknown> = {}
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  
  if (filters.from || filters.to) {
    const dateFilter: Record<string, Date> = {}
    if (filters.from) dateFilter.gte = filters.from
    if (filters.to) {
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
        select: { id: true, email: true, role: true, studentProfile: { select: { firstName: true, lastName: true } } }
      }, 
      section: true, 
      flight: true 
    },
    orderBy: { createdAt: 'desc' }
  })
}

/* Fetch attendance records for reporting */
export async function attendanceReport(filters: { from?: Date; to?: Date; sectionId?: string; flightId?: string }) {
  const where: Record<string, unknown> = {}
  
  if (filters.sectionId || filters.flightId) {
    where.user = {
      studentProfile: {
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.flightId && { flightId: filters.flightId }),
      }
    }
  }

  if (filters.from || filters.to) {
    const dateFilter: Record<string, Date> = {}
    if (filters.from) dateFilter.gte = filters.from
    if (filters.to) {
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }
    where.date = dateFilter
  }

  return prisma.attendanceRecord.findMany({
    where,
    include: {
      user: {
        select: {
          id: true, email: true,
          studentProfile: { select: { firstName: true, lastName: true, sectionId: true, flightId: true } }
        }
      }
    },
    orderBy: { date: 'desc' },
    take: 5000
  })
}

/* Fetch grade records for reporting */
export async function gradesReport(filters: { sectionId?: string }) {
  const where: Record<string, unknown> = {}
  
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }

  return prisma.studentGrade.findMany({
    where,
    include: {
      student: {
        select: {
          id: true, email: true,
          studentProfile: { select: { firstName: true, lastName: true } }
        }
      },
      gradeItem: {
        select: { title: true, maxScore: true, category: { select: { name: true, weight: true } } }
      }
    },
    orderBy: { id: 'desc' },
    take: 5000
  })
}

/* Fetch merit/demerit records for reporting */
export async function meritsReport(filters: { from?: Date; to?: Date; sectionId?: string }) {
  const where: Record<string, unknown> = {}
  
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }

  if (filters.from || filters.to) {
    const dateFilter: Record<string, Date> = {}
    if (filters.from) dateFilter.gte = filters.from
    if (filters.to) {
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      dateFilter.lte = toDate
    }
    where.createdAt = dateFilter
  }

  return prisma.meritDemerit.findMany({
    where,
    include: {
      student: {
        select: {
          id: true, email: true,
          studentProfile: { select: { firstName: true, lastName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5000
  })
}

/* Convert an array of flat objects to a CSV string */
export function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return ""
  
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(","),
    ...rows.map((row) => 
      headers.map((key) => {
        const value = row[key]
        if (value === null || value === undefined) return ""
        let str = String(value)
        // Prevent CSV injection: prefix dangerous characters with a single quote
        if (/^[=+\-@\t\r]/.test(str)) {
          str = "'" + str
        }
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(",")
    )
  ]
  return lines.join("\n")
}
