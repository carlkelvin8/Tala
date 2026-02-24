import { Context } from "hono"
import { AttendanceStatus, EnrollmentStatus, MeritType } from "@prisma/client"
import { ok } from "../lib/response.js"
import { prisma } from "../lib/prisma.js"

export async function summary(c: Context) {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [attendanceTotal, attendancePresent, enrollmentsApproved, gradeAgg, meritsMerit, meritsDemerit] =
    await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          date: { gte: since }
        }
      }),
      prisma.attendanceRecord.count({
        where: {
          date: { gte: since },
          status: {
            in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE]
          }
        }
      }),
      prisma.enrollment.count({
        where: {
          status: EnrollmentStatus.APPROVED
        }
      }),
      prisma.studentGrade.aggregate({
        _avg: {
          score: true
        }
      }),
      prisma.meritDemerit.aggregate({
        _sum: {
          points: true
        },
        where: {
          type: MeritType.MERIT
        }
      }),
      prisma.meritDemerit.aggregate({
        _sum: {
          points: true
        },
        where: {
          type: MeritType.DEMERIT
        }
      })
    ])

  const attendanceRate =
    attendanceTotal > 0 ? (attendancePresent / attendanceTotal) * 100 : null

  const gradeAverage = gradeAgg._avg.score ?? null

  const netMerits = (meritsMerit._sum.points ?? 0) - (meritsDemerit._sum.points ?? 0)

  return c.json(
    ok("Dashboard summary fetched", {
      attendanceRate,
      gradeAverage,
      netMerits,
      enrollmentCount: enrollmentsApproved
    })
  )
}

