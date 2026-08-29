import { prisma } from "../lib/prisma.js"
import { programUserScope } from "./programScope.js"
import { NstpType } from "@prisma/client"

/* Fetch enrollment records for reporting, with optional date range and scope filters */
export async function enrollmentReport(filters: { from?: Date; to?: Date; sectionId?: string; flightId?: string }, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = {}
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.flightId) where.flightId = filters.flightId
  // Scoped staff only export their own program's enrollments (via the student)
  const scope = programUserScope(scopeProgram)
  if (scope) where.user = scope
  
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
export async function attendanceReport(filters: { from?: Date; to?: Date; sectionId?: string; flightId?: string }, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = {}

  const userScope = programUserScope(scopeProgram)
  if (filters.sectionId || filters.flightId) {
    where.user = {
      ...(userScope ? { AND: [userScope] as Record<string, unknown>[] } : {}),
      studentProfile: {
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.flightId && { flightId: filters.flightId }),
      },
    }
  } else if (userScope) {
    where.user = userScope
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
export async function gradesReport(filters: { sectionId?: string }, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = {}
  
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }
  // Scoped staff only export their own program's grades
  const scope = programUserScope(scopeProgram)
  if (scope) {
    if (where.student) {
      where.student = { AND: [where.student as Record<string, unknown>, scope as Record<string, unknown>] }
    } else {
      where.student = scope
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
export async function meritsReport(filters: { from?: Date; to?: Date; sectionId?: string }, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = {}
  
  if (filters.sectionId) {
    where.student = {
      studentProfile: { sectionId: filters.sectionId }
    }
  }
  // Scoped staff only export their own program's merits
  const scope = programUserScope(scopeProgram)
  if (scope) {
    if (where.student) {
      where.student = { AND: [where.student as Record<string, unknown>, scope as Record<string, unknown>] }
    } else {
      where.student = scope
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
