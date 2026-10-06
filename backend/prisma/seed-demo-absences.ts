/*
 * Additive demo seed: one student account with 4 absences (past the 3-absence limit,
 * so the system marks it FAILED_ABSENCES).
 *
 * Safe to run against any database and safe to re-run: it only upserts the demo
 * account and its 4 ABSENT records. Unlike prisma/seed.ts it never deletes anything.
 *
 *   npx tsx prisma/seed-demo-absences.ts
 *
 * Login:  demo.absences@nstp.local  /  Password123!
 */
import { PrismaClient, RoleType, AttendanceStatus, NstpType, EnrollmentStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { checkAndMarkAbsences } from "../src/services/absenceService.js"
import { utcStartOfDay } from "../src/lib/dates.js"

const prisma = new PrismaClient()
const EMAIL = "demo.absences@nstp.local"
const PASSWORD = "Password123!"
const STUDENT_NO = "2024-DEMO4"
const ABSENCE_COUNT = 4

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { isActive: true, deletedAt: null },
    create: { email: EMAIL, passwordHash, role: RoleType.STUDENT, program: NstpType.CWTS },
  })

  // Attach to the demo CWTS section when it exists (the main seed creates it)
  const section = await prisma.section.findUnique({ where: { code: "CWTS-SEC-A" }, select: { id: true } })

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      studentNo: STUDENT_NO,
      firstName: "Demo",
      lastName: "Absences",
      gender: "Male",
      birthDate: new Date("2004-01-01"),
      contactNo: "09170000004",
      address: "Demo Address, Pasay City",
      sectionId: section?.id,
    },
  })

  const hasEnrollment = await prisma.enrollment.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!hasEnrollment) {
    await prisma.enrollment.create({
      data: { userId: user.id, status: EnrollmentStatus.APPROVED, sectionId: section?.id },
    })
  }

  // 4 distinct past calendar days, one week apart
  for (let i = 1; i <= ABSENCE_COUNT; i++) {
    const date = utcStartOfDay(new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000))
    await prisma.attendanceRecord.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: { status: AttendanceStatus.ABSENT, checkInAt: null, checkOutAt: null },
      create: { userId: user.id, date, status: AttendanceStatus.ABSENT, remarks: "Demo absence" },
    })
  }

  // Apply the real absence rule so the account state matches what the app would produce
  await checkAndMarkAbsences(user.id)

  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { status: true } })
  console.log(`Demo account ready: ${EMAIL} / ${PASSWORD}`)
  console.log(`Absences: ${ABSENCE_COUNT} — status: ${profile?.status}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
