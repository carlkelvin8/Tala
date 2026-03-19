// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import Prisma enums used to filter attendance, enrollment, and merit records
import { AttendanceStatus, EnrollmentStatus, MeritType } from "@prisma/client"
// Import the ok response helper for standardised API envelopes
import { ok } from "../lib/response.js"
// Import the Prisma client for direct database queries
import { prisma } from "../lib/prisma.js"

/* GET /api/dashboard/ — return aggregated statistics for the dashboard */
export async function summary(c: Context) {
  // Calculate the date 30 days ago to scope attendance statistics to the last month
  const since = new Date()
  since.setDate(since.getDate() - 30) // Subtract 30 days from today

  // Run all six database aggregation queries in parallel for performance
  const [attendanceTotal, attendancePresent, enrollmentsApproved, gradeAgg, meritsMerit, meritsDemerit] =
    await Promise.all([
      // Count all attendance records in the last 30 days (regardless of status)
      prisma.attendanceRecord.count({
        where: {
          date: { gte: since } // Only records from the last 30 days
        }
      }),
      // Count attendance records where the student was PRESENT or LATE in the last 30 days
      prisma.attendanceRecord.count({
        where: {
          date: { gte: since }, // Only records from the last 30 days
          status: {
            in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] // Count both present and late as attended
          }
        }
      }),
      // Count the total number of approved enrollments
      prisma.enrollment.count({
        where: {
          status: EnrollmentStatus.APPROVED // Only count approved enrollments
        }
      }),
      // Calculate the average score across all student grade records
      prisma.studentGrade.aggregate({
        _avg: {
          score: true // Compute the mean of the score column
        }
      }),
      // Sum all merit points awarded to students
      prisma.meritDemerit.aggregate({
        _sum: {
          points: true // Sum the points column for merits
        },
        where: {
          type: MeritType.MERIT // Only include MERIT type records
        }
      }),
      // Sum all demerit points deducted from students
      prisma.meritDemerit.aggregate({
        _sum: {
          points: true // Sum the points column for demerits
        },
        where: {
          type: MeritType.DEMERIT // Only include DEMERIT type records
        }
      })
    ])

  // Calculate the attendance rate as a percentage; return null if no records exist
  const attendanceRate =
    attendanceTotal > 0 ? (attendancePresent / attendanceTotal) * 100 : null

  // Extract the average grade score; use null if no grades have been recorded
  const gradeAverage = gradeAgg._avg.score ?? null

  // Compute net merits by subtracting total demerit points from total merit points
  const netMerits = (meritsMerit._sum.points ?? 0) - (meritsDemerit._sum.points ?? 0)

  // Return all four summary statistics in a single response
  return c.json(
    ok("Dashboard summary fetched", {
      attendanceRate,                      // Percentage of attended sessions in the last 30 days
      gradeAverage,                        // Average student grade score across all items
      netMerits,                           // Net merit points (merits minus demerits)
      enrollmentCount: enrollmentsApproved // Total number of approved enrollments
    })
  )
}
