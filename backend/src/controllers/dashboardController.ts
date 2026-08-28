// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import Prisma enums used to filter attendance, enrollment, and merit records
import { AttendanceStatus, EnrollmentStatus, MeritType, NstpType, RoleType } from "@prisma/client"
// Import the ok response helper for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the Prisma client for direct database queries
import { prisma } from "../lib/prisma.js"
// Import the authenticated user helper
import { getAuthUser } from "../middlewares/auth.js"

/* Determine which NSTP program the dashboard should be scoped to.
   Admins always see the aggregate; everyone else is scoped to their
   account-level program, falling back to their section's course program. */
async function resolveProgram(c: Context): Promise<NstpType | null> {
  const authUser = getAuthUser(c)
  if (authUser.role === RoleType.IMPLEMENTOR) return NstpType.CWTS
  if (authUser.program) return authUser.program
  if (authUser.role === RoleType.ADMIN) return null
  if (authUser.sectionId && (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER)) {
    const section = await prisma.section.findUnique({
      where: { id: authUser.sectionId },
      select: { course: { select: { nstpType: true } } }
    })
    if (section?.course?.nstpType) return section.course.nstpType
  }
  return null
}

/* GET /api/dashboard/ — return aggregated statistics for the dashboard */
export async function summary(c: Context) {
  // Scope every aggregation to the authenticated user's program (null for admins)
  const program = await resolveProgram(c)
  const attendanceFilter = program ? { user: { program } } : {}
  const enrollmentFilter = program ? { user: { program } } : {}
  const gradeFilter = program ? { student: { program } } : {}
  const meritFilter = program ? { student: { program } } : {}

  // Calculate the date 30 days ago to scope attendance statistics to the last month
  const since = new Date()
  since.setDate(since.getDate() - 30) // Subtract 30 days from today

  // Run all six database aggregation queries in parallel for performance
  const [attendanceTotal, attendancePresent, enrollmentsApproved, gradeAgg, meritsMerit, meritsDemerit] =
    await Promise.all([
      // Count all attendance records in the last 30 days (regardless of status)
      prisma.attendanceRecord.count({
        where: {
          date: { gte: since }, // Only records from the last 30 days
          ...attendanceFilter
        }
      }),
      // Count attendance records where the student was PRESENT or LATE in the last 30 days
      prisma.attendanceRecord.count({
        where: {
          date: { gte: since }, // Only records from the last 30 days
          ...attendanceFilter,
          status: {
            in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] // Count both present and late as attended
          }
        }
      }),
      // Count the total number of approved enrollments
      prisma.enrollment.count({
        where: {
          ...enrollmentFilter,
          status: EnrollmentStatus.APPROVED // Only count approved enrollments
        }
      }),
      // Calculate the average score across all student grade records
      prisma.studentGrade.aggregate({
        _avg: {
          score: true // Compute the mean of the score column
        },
        where: gradeFilter
      }),
      // Sum all merit points awarded to students
      prisma.meritDemerit.aggregate({
        _sum: {
          points: true // Sum the points column for merits
        },
        where: {
          ...meritFilter,
          type: MeritType.MERIT // Only include MERIT type records
        }
      }),
      // Sum all demerit points deducted from students
      prisma.meritDemerit.aggregate({
        _sum: {
          points: true // Sum the points column for demerits
        },
        where: {
          ...meritFilter,
          type: MeritType.DEMERIT // Only include DEMERIT type records
        }
      })
    ])

  // Calculate the attendance rate as a percentage; return null if no records exist
  const attendanceRate =
    attendanceTotal > 0 ? (attendancePresent / attendanceTotal) * 100 : null

  // Extract the average grade score; use null if no grades have been recorded
  const gradeAverage = gradeAgg._avg?.score ?? null

  // Compute net merits by subtracting total demerit points from total merit points
  const netMerits = (meritsMerit._sum.points ?? 0) - (meritsDemerit._sum.points ?? 0)

  // Return all four summary statistics in a single response
  return c.json(
    ok("Dashboard summary fetched", {
      program: program
        ? { type: program, label: program === NstpType.ROTC ? "Reserved Officers' Training Corps" : "Civic Welfare Training Service" }
        : null,
      attendanceRate,                      // Percentage of attended sessions in the last 30 days
      gradeAverage,                        // Average student grade score across all items
      netMerits,                           // Net merit points (merits minus demerits)
      enrollmentCount: enrollmentsApproved // Total number of approved enrollments
    })
  )
}

/* Compute a student's total grade as a weighted percentage across grade categories.
   Category weights are treated as percentages (e.g. 30, 40, 30); when they are
   stored as fractions (sum <= 2), the result is scaled up to a percentage. */
function computeWeightedTotalGrade(
  categories: Array<{
    name: string
    weight: number | null
    items: Array<{ maxScore: number; grades: Array<{ score: number }> }>
  }>
) {
  const breakdown = categories.map((category) => {
    let score = 0
    let max = 0
    for (const item of category.items) {
      const grade = item.grades[0]
      if (grade) {
        score += grade.score
        max += item.maxScore
      }
    }
    return { name: category.name, weight: category.weight, score, max }
  })

  const weighted = breakdown.filter((c) => c.weight && c.weight > 0 && c.max > 0)
  if (weighted.length > 0) {
    const weightSum = weighted.reduce((sum, c) => sum + (c.weight ?? 0), 0)
    let total = weighted.reduce((sum, c) => sum + (c.score / c.max) * (c.weight ?? 0), 0)
    if (weightSum > 0 && weightSum <= 2) total *= 100
    return { breakdown, totalPercent: Math.min(100, Math.max(0, total)) }
  }

  const score = breakdown.reduce((sum, c) => sum + c.score, 0)
  const max = breakdown.reduce((sum, c) => sum + c.max, 0)
  return {
    breakdown,
    totalPercent: max > 0 ? Math.min(100, Math.max(0, (score / max) * 100)) : null,
  }
}

/* GET /api/dashboard/my — personalized summary for the logged-in student:
   enrollment status, weighted total grade, attendance, and pending submissions */
export async function studentSummary(c: Context) {
  const authUser = getAuthUser(c)
  const userId = authUser.id

  const [enrollment, gradeCategories, attendanceRecords, pendingSubmissions] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        section: {
          select: {
            id: true,
            code: true,
            name: true,
            course: { select: { id: true, code: true, name: true, nstpType: true } },
          },
        },
      },
    }),
    prisma.gradeCategory.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            grades: { where: { studentId: userId }, select: { score: true } },
          },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { userId },
      select: { status: true },
    }),
    prisma.documentSubmission.count({ where: { userId, status: "PENDING" } }),
  ])

  const grade = computeWeightedTotalGrade(gradeCategories)

  const attendanceTotal = attendanceRecords.length
  const attendancePresent = attendanceRecords.filter(
    (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE
  ).length
  const attendanceAbsent = attendanceRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length

  const program = authUser.program ?? enrollment?.section?.course?.nstpType ?? null

  return c.json(
    ok("Student dashboard fetched", {
      program,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            createdAt: enrollment.createdAt,
            section: enrollment.section
              ? {
                  id: enrollment.section.id,
                  code: enrollment.section.code,
                  name: enrollment.section.name,
                  course: enrollment.section.course,
                }
              : null,
          }
        : null,
      totalGrade: grade,
      attendance: {
        recorded: attendanceTotal,
        attended: attendancePresent,
        absent: attendanceAbsent,
        rate: attendanceTotal > 0 ? (attendancePresent / attendanceTotal) * 100 : null,
      },
      pendingSubmissions,
    })
  )
}