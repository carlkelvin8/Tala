import { prisma } from "../lib/prisma.js"
import { AttendanceStatus } from "@prisma/client"

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
 * computes streaks, points and badges. Optionally scoped to a section.
 */
export async function getLeaderboard(filters?: { sectionId?: string }) {
  const students = await prisma.studentProfile.findMany({
    where: {
      status: "ACTIVE",
      ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
    },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      studentNo: true,
      section: { select: { name: true, code: true } },
    },
  })

  const entries: LeaderboardEntry[] = []

  for (const student of students) {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: student.userId },
      orderBy: { date: "desc" },
      select: { status: true, checkInAt: true },
    })

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

  entries.sort((a, b) => b.points - a.points || b.attendanceRate - a.attendanceRate)
  entries.forEach((entry, index) => {
    entry.rank = index + 1
  })

  return entries
}
