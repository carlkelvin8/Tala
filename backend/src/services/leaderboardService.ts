import { prisma } from "../lib/prisma.js"
import { AttendanceStatus, NstpType } from "@prisma/client"
import { programUserScope } from "./programScope.js"

type Badge = { key: string; label: string; icon: string }

export type LeaderboardEntry = {
  userId: string
  name: string
  studentNo: string | null
  sectionName: string | null
  present: number
  late: number
  absent: number
  totalSessions: number
  attendanceRate: number
  currentStreak: number
  points: number
  badges: Badge[]
  rank?: number
}

/**
 * Gamified leaderboard — ranks students by attendance performance,
 * computes streaks, points and badges. Optionally scoped to a section,
 * and always scoped to the caller's program when one is provided.
 * Aggregation is limited to the current active term when one exists.
 */
export async function getLeaderboard(filters?: { sectionId?: string }, scopeProgram?: NstpType | null) {
  const where: Record<string, unknown> = { status: "ACTIVE" }
  if (filters?.sectionId) {
    where.sectionId = filters.sectionId
    if (scopeProgram) {
      // A section filter from scoped staff must belong to their program
      const section = await prisma.section.findUnique({
        where: { id: filters.sectionId },
        select: { course: { select: { nstpType: true } } },
      })
      if (!section?.course || section.course.nstpType !== scopeProgram) {
        throw new Error("Section does not belong to your program")
      }
    }
  } else if (scopeProgram) {
    const scope = programUserScope(scopeProgram)
    if (scope) where.user = scope
  }

  // Term lookup and student list are independent — run them together so
  // the request costs ~2 sequential round trips instead of 3.
  const [term, students] = await Promise.all([
    prisma.academicTerm.findFirst({ where: { isActive: true } }),
    prisma.studentProfile.findMany({
      where,
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        studentNo: true,
        section: { select: { name: true, code: true } },
      },
    }),
  ])
  // Current active term bounds the aggregation window
  const recordWindow = { ...(term ? { date: { gte: term.startDate, lte: term.endDate } } : {}) }

  if (students.length === 0) return []

  // One query for every student's records (most recent first per student).
  // Previously this looped one query per student (N+1), which made the
  // leaderboard page slow as enrollment grew.
  const allRecords = await prisma.attendanceRecord.findMany({
    where: { userId: { in: students.map((s) => s.userId) }, ...recordWindow },
    orderBy: [{ userId: "asc" }, { date: "desc" }],
    select: { userId: true, status: true, checkInAt: true },
  })

  const recordsByUser = new Map<string, typeof allRecords>()
  for (const record of allRecords) {
    const list = recordsByUser.get(record.userId)
    if (list) list.push(record)
    else recordsByUser.set(record.userId, [record])
  }

  const entries: LeaderboardEntry[] = []

  for (const student of students) {
    const records = recordsByUser.get(student.userId) ?? []

    if (records.length === 0) continue

    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length
    const total = records.length
    const attendanceRate = Math.round(((present + late) / total) * 100)

    // Current streak of consecutive non-absent sessions (most recent first)
    let currentStreak = 0
    for (const record of records) {
      if (record.status === AttendanceStatus.ABSENT) break
      currentStreak++
    }

    // Points: present = 10, late = 5, absent = -5, streak bonus = +2 per streak week (capped)
    const points = present * 10 + late * 5 - absent * 5 + Math.min(currentStreak, 10) * 2

    const badges: Badge[] = []
    if (total >= 3 && absent === 0) badges.push({ key: "perfect", label: "Perfect Attendance", icon: "🏆" })
    if (currentStreak >= 4) badges.push({ key: "streak", label: `${currentStreak}-Session Streak`, icon: "🔥" })
    const earlyCount = records.filter(
      (r) => r.checkInAt && new Date(r.checkInAt).getHours() < 7 && (r.status as AttendanceStatus) !== AttendanceStatus.ABSENT
    ).length
    if (earlyCount >= 3) badges.push({ key: "early", label: "Early Bird", icon: "🌅" })
    if (attendanceRate >= 90 && total >= 4) badges.push({ key: "reliable", label: "Reliable Cadet", icon: "🎖️" })
    if (present >= 6) badges.push({ key: "veteran", label: "Veteran", icon: "⭐" })

    entries.push({
      userId: student.userId,
      name: `${student.firstName} ${student.lastName}`,
      studentNo: student.studentNo,
      sectionName: student.section?.name ?? null,
      present,
      late,
      absent,
      totalSessions: total,
      attendanceRate,
      currentStreak,
      points,
      badges,
    })
  }

  // Rank by points, then attendance rate, then name for a stable order
  entries.sort((a, b) => b.points - a.points || b.attendanceRate - a.attendanceRate || a.name.localeCompare(b.name))
  entries.forEach((entry, index) => {
    entry.rank = index + 1
  })

  return entries
}
