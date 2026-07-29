import {
  PrismaClient,
  RoleType,
  EnrollmentStatus,
  MaterialCategory,
  AttendanceStatus,
  MeritType,
  ExamStatus,
  NstpType,
  StudentStatus,
} from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const PASSWORD = "Password123!"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)
  console.log("🌱  Seeding database…")

  // ── 1. USERS ────────────────────────────────────────────────────────────────
  console.log("  → Users")

  const admin = await prisma.user.upsert({
    where: { email: "admin@nstp.local" },
    update: {},
    create: { email: "admin@nstp.local", passwordHash: hash, role: RoleType.ADMIN },
  })

  const impl1 = await prisma.user.upsert({
    where: { email: "implementor@nstp.local" },
    update: {},
    create: { email: "implementor@nstp.local", passwordHash: hash, role: RoleType.IMPLEMENTOR },
  })

  const impl2 = await prisma.user.upsert({
    where: { email: "implementor2@nstp.local" },
    update: {},
    create: { email: "implementor2@nstp.local", passwordHash: hash, role: RoleType.IMPLEMENTOR },
  })

  const cadet1 = await prisma.user.upsert({
    where: { email: "cadet@nstp.local" },
    update: {},
    create: { email: "cadet@nstp.local", passwordHash: hash, role: RoleType.CADET_OFFICER },
  })

  const cadet2 = await prisma.user.upsert({
    where: { email: "cadet2@nstp.local" },
    update: {},
    create: { email: "cadet2@nstp.local", passwordHash: hash, role: RoleType.CADET_OFFICER },
  })

  // 10 students
  const studentData = [
    { email: "student@nstp.local",   firstName: "Juan",     lastName: "Dela Cruz",   studentNo: "2024-00001", gender: "Male",   bday: new Date("2004-03-15") },
    { email: "student2@nstp.local",  firstName: "Maria",    lastName: "Santos",      studentNo: "2024-00002", gender: "Female", bday: new Date("2004-07-22") },
    { email: "student3@nstp.local",  firstName: "Carlos",   lastName: "Reyes",       studentNo: "2024-00003", gender: "Male",   bday: new Date("2003-11-05") },
    { email: "student4@nstp.local",  firstName: "Ana",      lastName: "Garcia",      studentNo: "2024-00004", gender: "Female", bday: new Date("2004-01-30") },
    { email: "student5@nstp.local",  firstName: "Miguel",   lastName: "Torres",      studentNo: "2024-00005", gender: "Male",   bday: new Date("2003-06-18") },
    { email: "student6@nstp.local",  firstName: "Liza",     lastName: "Flores",      studentNo: "2024-00006", gender: "Female", bday: new Date("2004-09-12") },
    { email: "student7@nstp.local",  firstName: "Ramon",    lastName: "Cruz",        studentNo: "2024-00007", gender: "Male",   bday: new Date("2003-04-25") },
    { email: "student8@nstp.local",  firstName: "Carina",   lastName: "Lim",         studentNo: "2024-00008", gender: "Female", bday: new Date("2004-12-08") },
    { email: "student9@nstp.local",  firstName: "Andres",   lastName: "Villanueva",  studentNo: "2024-00009", gender: "Male",   bday: new Date("2003-08-14") },
    { email: "student10@nstp.local", firstName: "Patricia", lastName: "Mendoza",     studentNo: "2024-00010", gender: "Female", bday: new Date("2004-05-03") },
  ]

  const studentUsers: typeof admin[] = []
  for (const s of studentData) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, passwordHash: hash, role: RoleType.STUDENT },
    })
    studentUsers.push(u)
  }

  // ── 2. PROFILES ─────────────────────────────────────────────────────────────
  console.log("  → Profiles")

  await prisma.implementorProfile.upsert({
    where: { userId: impl1.id },
    update: {},
    create: { userId: impl1.id, firstName: "Jose",    lastName: "Rizal",    contactNo: "09171234567" },
  })

  await prisma.implementorProfile.upsert({
    where: { userId: impl2.id },
    update: {},
    create: { userId: impl2.id, firstName: "Andres",  lastName: "Bonifacio", contactNo: "09189876543" },
  })

  await prisma.cadetOfficerProfile.upsert({
    where: { userId: cadet1.id },
    update: {},
    create: { userId: cadet1.id, firstName: "Emilio",  lastName: "Aguinaldo", contactNo: "09201112222" },
  })

  await prisma.cadetOfficerProfile.upsert({
    where: { userId: cadet2.id },
    update: {},
    create: { userId: cadet2.id, firstName: "Antonio", lastName: "Luna",      contactNo: "09203334444" },
  })

  // ── 3. COURSES ───────────────────────────────────────────────────────────────
  console.log("  → Courses")

  const cwtsCourse = await prisma.course.upsert({
    where: { code: "CWTS-101" },
    update: {},
    create: { code: "CWTS-101", name: "Civic Welfare Training Service 1", nstpType: NstpType.CWTS },
  })

  const cwts2Course = await prisma.course.upsert({
    where: { code: "CWTS-102" },
    update: {},
    create: { code: "CWTS-102", name: "Civic Welfare Training Service 2", nstpType: NstpType.CWTS },
  })

  const rotcCourse = await prisma.course.upsert({
    where: { code: "ROTC-101" },
    update: {},
    create: { code: "ROTC-101", name: "Reserve Officers Training Corps 1", nstpType: NstpType.ROTC },
  })

  const rotc2Course = await prisma.course.upsert({
    where: { code: "ROTC-102" },
    update: {},
    create: { code: "ROTC-102", name: "Reserve Officers Training Corps 2", nstpType: NstpType.ROTC },
  })

  // ── 4. SECTIONS ──────────────────────────────────────────────────────────────
  console.log("  → Sections")

  const secA = await prisma.section.upsert({
    where: { code: "CWTS-SEC-A" },
    update: {},
    create: { code: "CWTS-SEC-A", name: "CWTS Section Alpha",   courseId: cwtsCourse.id },
  })

  const secB = await prisma.section.upsert({
    where: { code: "CWTS-SEC-B" },
    update: {},
    create: { code: "CWTS-SEC-B", name: "CWTS Section Bravo",   courseId: cwts2Course.id },
  })

  const secC = await prisma.section.upsert({
    where: { code: "ROTC-SEC-C" },
    update: {},
    create: { code: "ROTC-SEC-C", name: "ROTC Section Charlie", courseId: rotcCourse.id },
  })

  const secD = await prisma.section.upsert({
    where: { code: "ROTC-SEC-D" },
    update: {},
    create: { code: "ROTC-SEC-D", name: "ROTC Section Delta",   courseId: rotc2Course.id },
  })

  // ── 5. FLIGHTS ───────────────────────────────────────────────────────────────
  console.log("  → Flights")

  const flt1 = await prisma.flight.upsert({
    where: { code: "ROTC-FLT-1" },
    update: {},
    create: { code: "ROTC-FLT-1", name: "Alpha Flight" },
  })

  const flt2 = await prisma.flight.upsert({
    where: { code: "ROTC-FLT-2" },
    update: {},
    create: { code: "ROTC-FLT-2", name: "Bravo Flight" },
  })

  const flt3 = await prisma.flight.upsert({
    where: { code: "ROTC-FLT-3" },
    update: {},
    create: { code: "ROTC-FLT-3", name: "Charlie Flight" },
  })

  // ── 6. STUDENT PROFILES + SECTION / FLIGHT ASSIGNMENT ───────────────────────
  console.log("  → Student Profiles")

  const sections = [secA, secA, secA, secA, secB, secB, secB, secC, secC, secD]
  const flights  = [flt1, flt1, flt2, flt2, flt2, flt3, flt3, flt1, flt3, flt2]

  for (let i = 0; i < studentUsers.length; i++) {
    const u = studentUsers[i]
    const s = studentData[i]
    await prisma.studentProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId:    u.id,
        studentNo: s.studentNo,
        firstName: s.firstName,
        lastName:  s.lastName,
        gender:    s.gender,
        birthDate: s.bday,
        contactNo: `0917${String(i + 1).padStart(7, "0")}`,
        address:   `${i + 1} Sampaguita St., Manila`,
        sectionId: sections[i].id,
        flightId:  flights[i].id,
        status:    StudentStatus.ACTIVE,
      },
    })
  }

  // ── 7. ENROLLMENTS ───────────────────────────────────────────────────────────
  console.log("  → Enrollments")

  // Delete stale enrollments so we can re-create cleanly
  await prisma.enrollment.deleteMany({
    where: { userId: { in: studentUsers.map((u) => u.id) } },
  })

  const enrollStatuses = [
    EnrollmentStatus.APPROVED, EnrollmentStatus.APPROVED, EnrollmentStatus.APPROVED,
    EnrollmentStatus.APPROVED, EnrollmentStatus.APPROVED, EnrollmentStatus.APPROVED,
    EnrollmentStatus.PENDING,  EnrollmentStatus.PENDING,
    EnrollmentStatus.REJECTED, EnrollmentStatus.APPROVED,
  ]

  const enrollments = []
  for (let i = 0; i < studentUsers.length; i++) {
    const e = await prisma.enrollment.create({
      data: {
        userId:    studentUsers[i].id,
        sectionId: sections[i].id,
        flightId:  flights[i].id,
        status:    enrollStatuses[i],
      },
    })
    enrollments.push(e)
  }

  // Cadet officers also enrolled
  await prisma.enrollment.deleteMany({ where: { userId: { in: [cadet1.id, cadet2.id] } } })
  await prisma.enrollment.create({ data: { userId: cadet1.id, sectionId: secA.id, flightId: flt1.id, status: EnrollmentStatus.APPROVED } })
  await prisma.enrollment.create({ data: { userId: cadet2.id, sectionId: secC.id, flightId: flt1.id, status: EnrollmentStatus.APPROVED } })

  // ── 8. ACADEMIC TERMS ────────────────────────────────────────────────────────
  console.log("  → Academic Terms")

  await prisma.academicTerm.deleteMany()

  const term1 = await prisma.academicTerm.create({
    data: { name: "1st Semester AY 2023-2024", startDate: new Date("2023-08-07"), endDate: new Date("2023-12-15"), isActive: false },
  })

  const term2 = await prisma.academicTerm.create({
    data: { name: "2nd Semester AY 2023-2024", startDate: new Date("2024-01-08"), endDate: new Date("2024-05-31"), isActive: false },
  })

  const term3 = await prisma.academicTerm.create({
    data: { name: "1st Semester AY 2024-2025", startDate: new Date("2024-08-05"), endDate: new Date("2024-12-20"), isActive: true },
  })

  // ── 9. ANNOUNCEMENTS ─────────────────────────────────────────────────────────
  console.log("  → Announcements")

  await prisma.announcement.deleteMany()

  await prisma.announcement.createMany({
    data: [
      { title: "Welcome to NSTP AY 2024-2025!", body: "Dear NSTP students, welcome to the new academic year. Orientation will be held on August 10, 2024. Attendance is mandatory." },
      { title: "CWTS Community Extension Activity",    body: "All CWTS students are required to attend the tree-planting activity on September 7, 2024 at Luneta Park. Wear comfortable clothes." },
      { title: "ROTC Training Schedule Update",        body: "ROTC training is rescheduled to every Saturday, 7:00 AM – 12:00 PM starting August 17, 2024. Bring your complete uniform." },
      { title: "Midterm Exam Schedule",                body: "Midterm exams will be held on October 14-18, 2024. Review your respective schedules on the bulletin board." },
      { title: "Merit/Demerit System Reminder",        body: "Reminder: unexcused absences will result in demerit points. Three unexcused absences may lead to a FAILED status." },
      { title: "Final Exam & Graduation Ceremony",     body: "Final exams are scheduled for December 2-6, 2024. NSTP Completion Ceremony will be on December 14, 2024." },
    ],
  })

  // ── 10. LEARNING MATERIALS ───────────────────────────────────────────────────
  console.log("  → Learning Materials")

  await prisma.learningMaterial.deleteMany()

  const materialData = [
    { title: "NSTP Orientation Module",          description: "Introduction to NSTP, its history, and objectives.",           category: MaterialCategory.MODULE,       sectionId: secA.id,  flightId: null },
    { title: "CWTS Lecture 1: Community Service",description: "Understanding community service and its impact.",              category: MaterialCategory.LECTURE,      sectionId: secA.id,  flightId: null },
    { title: "CWTS Activity: Tree Planting Guide",description: "Step-by-step guide for the tree planting extension activity.",category: MaterialCategory.ACTIVITY,     sectionId: secA.id,  flightId: null },
    { title: "ROTC Drill Manual",                description: "Standard drill procedures for ROTC cadets.",                   category: MaterialCategory.MODULE,       sectionId: secC.id,  flightId: flt1.id },
    { title: "ROTC Lecture: Leadership",         description: "Principles of military leadership and discipline.",            category: MaterialCategory.LECTURE,      sectionId: secC.id,  flightId: null },
    { title: "Midterm Exam Reviewer",            description: "Comprehensive reviewer covering all topics to date.",          category: MaterialCategory.MODULE,       sectionId: secB.id,  flightId: null },
    { title: "Health & Safety Protocols",        description: "Guidelines on health protocols during activities.",            category: MaterialCategory.ANNOUNCEMENT, sectionId: null,     flightId: null },
    { title: "CWTS Module 2: Disaster Risk",     description: "Module on disaster risk reduction and management.",           category: MaterialCategory.MODULE,       sectionId: secB.id,  flightId: null },
    { title: "Final Term Activity Guide",        description: "Instructions for the culminating activity.",                   category: MaterialCategory.ACTIVITY,     sectionId: null,     flightId: flt2.id },
    { title: "Grading Criteria Announcement",   description: "Official grading criteria for NSTP AY 2024-2025.",            category: MaterialCategory.ANNOUNCEMENT, sectionId: null,     flightId: null },
  ]

  for (const m of materialData) {
    await prisma.learningMaterial.create({
      data: { ...m, createdById: impl1.id },
    })
  }

  // ── 11. ATTENDANCE SESSIONS + RECORDS ────────────────────────────────────────
  console.log("  → Attendance Sessions & Records")

  await prisma.attendanceRecord.deleteMany()
  await prisma.attendanceSession.deleteMany()

  // NAAP campus coords (Manila)
  const BASE_LAT = 14.5547
  const BASE_LON = 121.0244

  const approvedStudents = studentUsers.filter((_, i) => enrollStatuses[i] === EnrollmentStatus.APPROVED)

  // Create 4 weeks only for speed
  for (let week = 0; week < 4; week++) {
    const sessionDate = daysAgo(28 - week * 7)

    const session = await prisma.attendanceSession.create({
      data: {
        title:        `Week ${week + 1} Training`,
        date:         sessionDate,
        startTime:    new Date(sessionDate.setHours(7, 0, 0, 0)),
        endTime:      new Date(new Date(sessionDate).setHours(12, 0, 0, 0)),
        hostId:       impl1.id,
        hostLatitude:  BASE_LAT,
        hostLongitude: BASE_LON,
        radiusMeters: 100,
        requireVerifier: false,
        isActive:     false,
        sectionId:    secA.id,
        termId:       term3.id,
        remarks:      `Week ${week + 1} session completed.`,
      },
    })

    // Batch create attendance records
    const recordsToCreate = []
    for (let si = 0; si < approvedStudents.length; si++) {
      const roll = Math.random()
      const status =
        roll < 0.75 ? AttendanceStatus.PRESENT :
        roll < 0.88 ? AttendanceStatus.LATE :
                      AttendanceStatus.ABSENT

      const recordDate = new Date(session.date)

      recordsToCreate.push({
        userId:    approvedStudents[si].id,
        date:      recordDate,
        status,
        sessionId: session.id,
        checkInAt: status !== AttendanceStatus.ABSENT ? new Date(new Date(recordDate).setHours(7, status === AttendanceStatus.LATE ? 20 : 5, 0, 0)) : null,
        latitude:  status !== AttendanceStatus.ABSENT ? BASE_LAT + (Math.random() - 0.5) * 0.001 : null,
        longitude: status !== AttendanceStatus.ABSENT ? BASE_LON + (Math.random() - 0.5) * 0.001 : null,
      })
    }
    
    // Batch insert
    await prisma.attendanceRecord.createMany({ data: recordsToCreate, skipDuplicates: true })
  }

  // ── 12. GRADE CATEGORIES + ITEMS + STUDENT GRADES ───────────────────────────
  console.log("  → Grades")

  await prisma.studentGrade.deleteMany()
  await prisma.gradeItem.deleteMany()
  await prisma.gradeCategory.deleteMany()

  const catQuiz = await prisma.gradeCategory.create({ data: { name: "Quizzes",       weight: 20 } })
  const catMid  = await prisma.gradeCategory.create({ data: { name: "Midterm Exam",  weight: 30 } })
  const catFinal= await prisma.gradeCategory.create({ data: { name: "Final Exam",    weight: 30 } })
  const catPerf = await prisma.gradeCategory.create({ data: { name: "Performance",   weight: 20 } })

  const items = [
    await prisma.gradeItem.create({ data: { title: "Quiz 1",           maxScore: 50,  categoryId: catQuiz.id } }),
    await prisma.gradeItem.create({ data: { title: "Quiz 2",           maxScore: 50,  categoryId: catQuiz.id } }),
    await prisma.gradeItem.create({ data: { title: "Quiz 3",           maxScore: 50,  categoryId: catQuiz.id } }),
    await prisma.gradeItem.create({ data: { title: "Midterm Exam",     maxScore: 100, categoryId: catMid.id  } }),
    await prisma.gradeItem.create({ data: { title: "Final Exam",       maxScore: 100, categoryId: catFinal.id} }),
    await prisma.gradeItem.create({ data: { title: "Participation",    maxScore: 50,  categoryId: catPerf.id } }),
    await prisma.gradeItem.create({ data: { title: "Activity Output",  maxScore: 50,  categoryId: catPerf.id } }),
  ]

  const approvedForGrades = studentUsers.filter((_, i) => enrollStatuses[i] === EnrollmentStatus.APPROVED)
  const gradeData = []
  for (const student of approvedForGrades) {
    for (const item of items) {
      const min = item.maxScore * 0.55
      const score = parseFloat((min + Math.random() * (item.maxScore - min)).toFixed(1))
      gradeData.push({ studentId: student.id, gradeItemId: item.id, score, encodedById: impl1.id })
    }
  }
  await prisma.studentGrade.createMany({ data: gradeData, skipDuplicates: true })

  // ── 13. MERITS & DEMERITS ─────────────────────────────────────────────────────
  console.log("  → Merits & Demerits")

  await prisma.meritDemerit.deleteMany()

  const meritReasons = [
    { type: MeritType.MERIT,   points: 5,  reason: "Perfect attendance for the month" },
    { type: MeritType.MERIT,   points: 3,  reason: "Outstanding performance during drill" },
    { type: MeritType.MERIT,   points: 2,  reason: "Volunteered as session verifier" },
    { type: MeritType.DEMERIT, points: 3,  reason: "Unexcused absence" },
    { type: MeritType.DEMERIT, points: 2,  reason: "Late submission of requirements" },
    { type: MeritType.DEMERIT, points: 1,  reason: "Improper uniform during formation" },
  ]

  const meritData = []
  for (let i = 0; i < approvedForGrades.length; i++) {
    const student = approvedForGrades[i]
    const count = 2 + (i % 2)
    for (let j = 0; j < count; j++) {
      const r = meritReasons[(i + j) % meritReasons.length]
      meritData.push({ studentId: student.id, type: r.type, points: r.points, reason: r.reason, encodedById: impl1.id })
    }
  }
  await prisma.meritDemerit.createMany({ data: meritData })

  // ── 14. EXAM SESSIONS + ATTEMPTS + MONITORING LOGS ──────────────────────────
  console.log("  → Exams")

  await prisma.monitoringLog.deleteMany()
  await prisma.examAttempt.deleteMany()
  await prisma.examSession.deleteMany()

  const exam1 = await prisma.examSession.create({
    data: {
      title:       "NSTP Midterm Examination",
      description: "Covers topics from Weeks 1-4.",
      durationMin: 60,
      scheduledAt: daysAgo(30),
      status:      ExamStatus.CLOSED,
      sectionId:   secA.id,
    },
  })

  const exam2 = await prisma.examSession.create({
    data: {
      title:       "NSTP Final Examination",
      description: "Comprehensive final exam covering all topics.",
      durationMin: 90,
      scheduledAt: daysAgo(5),
      status:      ExamStatus.ACTIVE,
      sectionId:   secA.id,
    },
  })

  const exam3 = await prisma.examSession.create({
    data: {
      title:       "ROTC Leadership Quiz",
      description: "Short quiz on leadership principles.",
      durationMin: 30,
      scheduledAt: daysFromNow(7),
      status:      ExamStatus.SCHEDULED,
      sectionId:   secC.id,
      flightId:    flt1.id,
    },
  })

  const examEvents = ["tab_switch", "focus_lost", "face_not_detected", "browser_minimized"]

  for (const student of approvedForGrades.slice(0, 6)) {
    const attempt = await prisma.examAttempt.create({
      data: {
        examSessionId: exam1.id,
        studentId:     student.id,
        startedAt:     new Date(exam1.scheduledAt.getTime()),
        endedAt:       new Date(exam1.scheduledAt.getTime() + 58 * 60000),
        focusLosses:   Math.floor(Math.random() * 4),
        violations:    Math.floor(Math.random() * 2),
        isLocked:      false,
      },
    })

    // 1-3 monitoring logs per attempt
    const logCount = 1 + Math.floor(Math.random() * 3)
    for (let k = 0; k < logCount; k++) {
      await prisma.monitoringLog.create({
        data: {
          examAttemptId: attempt.id,
          event:         examEvents[k % examEvents.length],
        },
      })
    }
  }

  // ── 15. INSTRUCTOR REMARKS ───────────────────────────────────────────────────
  console.log("  → Instructor Remarks")

  await prisma.instructorRemark.deleteMany()

  const remarks = [
    "Shows consistent improvement in drills and formations.",
    "Needs to improve punctuality. Late 3 times this month.",
    "Excellent leadership during the community service activity.",
    "Has been actively participating in group discussions.",
    "Remind student to complete pending requirements.",
    "Outstanding volunteer work during the tree-planting activity.",
    "Student must work on discipline and uniform compliance.",
    "Very cooperative and helpful to fellow trainees.",
  ]

  for (let i = 0; i < approvedForGrades.length; i++) {
    await prisma.instructorRemark.create({
      data: {
        userId:    approvedForGrades[i].id,
        remark:    remarks[i % remarks.length],
        createdBy: impl1.id,
      },
    })
  }

  // Extra remarks from impl2
  for (let i = 0; i < 3; i++) {
    await prisma.instructorRemark.create({
      data: {
        userId:    approvedForGrades[i].id,
        remark:    remarks[(i + 3) % remarks.length],
        createdBy: impl2.id,
      },
    })
  }

  // ── 16. AUDIT LOGS ───────────────────────────────────────────────────────────
  console.log("  → Audit Logs")

  await prisma.auditLog.deleteMany()

  const auditEntries = [
    { actorId: admin.id,  action: "SEED",           entity: "System",           entityId: null },
    { actorId: admin.id,  action: "CREATE_USER",     entity: "User",             entityId: impl1.id },
    { actorId: admin.id,  action: "CREATE_SECTION",  entity: "Section",          entityId: secA.id  },
    { actorId: admin.id,  action: "CREATE_FLIGHT",   entity: "Flight",           entityId: flt1.id  },
    { actorId: admin.id,  action: "CREATE_TERM",     entity: "AcademicTerm",     entityId: term3.id },
    { actorId: impl1.id,  action: "APPROVE_ENROLL",  entity: "Enrollment",       entityId: enrollments[0].id },
    { actorId: impl1.id,  action: "REJECT_ENROLL",   entity: "Enrollment",       entityId: enrollments[8].id },
    { actorId: impl1.id,  action: "CREATE_SESSION",  entity: "AttendanceSession", entityId: null },
    { actorId: impl1.id,  action: "ENCODE_GRADE",    entity: "StudentGrade",     entityId: null },
    { actorId: impl2.id,  action: "POST_MATERIAL",   entity: "LearningMaterial", entityId: null },
    { actorId: cadet1.id, action: "MARK_ATTENDANCE", entity: "AttendanceRecord", entityId: null },
  ]

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: { ...entry, meta: { seeded: true } },
    })
  }

  // ── 17. FILE UPLOADS ─────────────────────────────────────────────────────────
  console.log("  → File Uploads")

  await prisma.fileUpload.deleteMany()

  await prisma.fileUpload.createMany({
    data: [
      { fileName: "nstp_orientation.pdf",  mimeType: "application/pdf",  size: 204800, url: "/uploads/nstp_orientation.pdf"  },
      { fileName: "drill_manual.pdf",      mimeType: "application/pdf",  size: 512000, url: "/uploads/drill_manual.pdf"      },
      { fileName: "activity_guide.docx",   mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 98304, url: "/uploads/activity_guide.docx" },
      { fileName: "class_photo.jpg",       mimeType: "image/jpeg",        size: 1048576, url: "/uploads/class_photo.jpg"     },
      { fileName: "midterm_reviewer.pdf",  mimeType: "application/pdf",  size: 307200, url: "/uploads/midterm_reviewer.pdf" },
    ],
  })

  // ── DONE ─────────────────────────────────────────────────────────────────────
  console.log("")
  console.log("✅  Seed complete! Summary:")
  console.log(`     Users:               ${2 + 2 + 2 + studentUsers.length} (1 admin, 2 implementors, 2 cadets, 10 students)`)
  console.log(`     Courses:             4`)
  console.log(`     Sections:            4`)
  console.log(`     Flights:             3`)
  console.log(`     Enrollments:         ${studentUsers.length + 2}`)
  console.log(`     Academic Terms:      3  (term3 is active)`)
  console.log(`     Announcements:       6`)
  console.log(`     Learning Materials:  ${materialData.length}`)
  console.log(`     Attendance Sessions: 8`)
  console.log(`     Grade Categories:    4`)
  console.log(`     Grade Items:         ${items.length}`)
  console.log(`     Exam Sessions:       3`)
  console.log(`     Merits/Demerits:     seeded per student`)
  console.log(`     Instructor Remarks:  seeded`)
  console.log(`     Audit Logs:          ${auditEntries.length}`)
  console.log(`     File Uploads:        5`)
  console.log("")
  console.log("  🔑  All passwords: Password123!")
  console.log("  📧  Admin:         admin@nstp.local")
  console.log("  📧  Implementor:   implementor@nstp.local")
  console.log("  📧  Cadet:         cadet@nstp.local")
  console.log("  📧  Student:       student@nstp.local  (through student10@nstp.local)")
}

main()
  .catch(async (error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
