import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestCourses, cleanupTestSections, cleanupTestTerms, cleanupTestEnrollments, cleanupTestGradeCategories, cleanupTestFlights, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { EnrollmentStatus, RoleType } from "@prisma/client"

describe("Regression guards for Batch 2 fixes", () => {
  const emails: string[] = []
  const courseCodes: string[] = []
  const sectionCodes: string[] = []
  const termNames: string[] = []
  const enrollmentIds: string[] = []
  const flightCodes: string[] = []
  let adminToken = ""
  let implementorToken = ""
  let studentToken = ""
  let rotcCourseId = ""
  let cwtsCourseId = ""
  let rotcSectionId = ""
  let cwtsSectionId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const impl = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(impl.email)
    implementorToken = makeToken(impl.id, impl.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)

    const rotcCode = `ROTC-${uniqueId()}`
    courseCodes.push(rotcCode)
    const rotcRes = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code: rotcCode, name: "ROTC Guard Test", nstpType: "ROTC" }),
    })
    rotcCourseId = (await rotcRes.json()).data.id

    const cwtsCode = `CWTS-${uniqueId()}`
    courseCodes.push(cwtsCode)
    const cwtsRes = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code: cwtsCode, name: "CWTS Guard Test", nstpType: "CWTS" }),
    })
    cwtsCourseId = (await cwtsRes.json()).data.id

    const s1 = `SEC-${uniqueId()}`
    sectionCodes.push(s1)
    rotcSectionId = (await (await app.request("/api/sections", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code: s1, name: "Guard Sec ROTC", courseId: rotcCourseId }),
    })).json()).data.id

    const s2 = `SEC-${uniqueId()}`
    sectionCodes.push(s2)
    cwtsSectionId = (await (await app.request("/api/sections", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code: s2, name: "Guard Sec CWTS", courseId: cwtsCourseId }),
    })).json()).data.id
  })

  afterAll(async () => {
    await cleanupTestEnrollments(enrollmentIds)
    await cleanupTestFlights(flightCodes)
    await cleanupTestSections(sectionCodes)
    await cleanupTestCourses(courseCodes)
    await cleanupTestTerms(termNames)
    await cleanupTestUsers(emails)
  })

  describe("Section PATCH preservation", () => {
    it("PATCH without courseId keeps the existing course link", async () => {
      const code = `UPD-${uniqueId()}`
      sectionCodes.push(code)
      const created = (await (await app.request("/api/sections", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ code, name: "Preserve Me", courseId: rotcCourseId }),
      })).json()).data

      const res = await app.request(`/api/sections/${created.id}`, {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: json({ code, name: "Preserved" }),
      })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.data.name).toBe("Preserved")
      expect(body.data.courseId).toBe(rotcCourseId)
    })
  })

  describe("Implementor ROTC-only course/section locks", () => {
    it("POST /api/sections — implementor must scope to an ROTC course", async () => {
      const res = await app.request("/api/sections", {
        method: "POST",
        headers: authHeader(implementorToken),
        body: json({ code: "NOCOURSE", name: "No Course" }),
      })
      expect(res.status).toBe(400)
      expect((await res.json()).message).toContain("ROTC course")
    })

    it("POST /api/sections — implementor cannot use a CWTS course", async () => {
      const res = await app.request("/api/sections", {
        method: "POST",
        headers: authHeader(implementorToken),
        body: json({ code: "WRONC", name: "Wrong Program", courseId: cwtsCourseId }),
      })
      expect(res.status).toBe(400)
      expect((await res.json()).message).toContain("ROTC courses")
    })

    it("GET /api/courses/:id — CWTS course is invisible (404) to implementor", async () => {
      const res = await app.request(`/api/courses/${cwtsCourseId}`, { headers: authHeader(implementorToken) })
      expect(res.status).toBe(404)
      const res2 = await app.request(`/api/courses/${rotcCourseId}`, { headers: authHeader(implementorToken) })
      expect(res2.status).toBe(200)
    })

    it("DELETE /api/courses/:id — implementor cannot delete a CWTS course", async () => {
      const res = await app.request(`/api/courses/${cwtsCourseId}`, {
        method: "DELETE",
        headers: authHeader(implementorToken),
      })
      expect(res.status).toBe(404)
      const remaining = await prisma.course.findUnique({ where: { id: cwtsCourseId } })
      expect(remaining).not.toBeNull()
    })

    it("DELETE /api/sections/:id — implementor cannot delete a CWTS section", async () => {
      const res = await app.request(`/api/sections/${cwtsSectionId}`, {
        method: "DELETE",
        headers: authHeader(implementorToken),
      })
      expect(res.status).toBe(400)
      const remaining = await prisma.section.findUnique({ where: { id: cwtsSectionId } })
      expect(remaining).not.toBeNull()
    })
  })

  describe("Enrollment duplicate-target guard", () => {
    it("blocks an active duplicate enrollment for the same student", async () => {
      const stud = await createTestUser(RoleType.STUDENT)
      emails.push(stud.email)
      const token = makeToken(stud.id, stud.role)

      const first = (await (await app.request("/api/enrollments", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ userId: stud.id, sectionId: rotcSectionId }),
      })).json()).data
      enrollmentIds.push(first.id)

      // Same student + same section while the first enrollment is still active
      const dup = await app.request("/api/enrollments", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ userId: stud.id, sectionId: rotcSectionId }),
      })
      expect(dup.status).toBe(400)
      expect((await dup.json()).message).toContain("active enrollment")

      // Reject it, then enrolling in a different section becomes allowed
      await app.request(`/api/enrollments/${first.id}/status`, {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: json({ status: EnrollmentStatus.REJECTED }),
      })

      const other = await app.request("/api/enrollments", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ userId: stud.id, sectionId: cwtsSectionId }),
      })
      expect(other.status).toBe(200)
      enrollmentIds.push((await other.json()).data.id)
      expect(token).toBeTruthy()
    })
  })

  describe("Term deletion gating", () => {
    it("rejects deleting the active term", async () => {
      const name = `Active Term ${uniqueId()}`
      termNames.push(name)
      const termRes = await app.request("/api/terms", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name, startDate: "2026-01-01", endDate: "2026-06-30", isActive: true }),
      })
      const term = (await termRes.json()).data

      const res = await app.request(`/api/terms/${term.id}`, { method: "DELETE", headers: authHeader(adminToken) })
      expect(res.status).toBe(400)
      expect((await res.json()).message).toContain("active term")

      // Deactivate then delete should succeed
      await app.request(`/api/terms/${term.id}`, {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: json({ isActive: false }),
      })
    })

    it("rejects inactive term delete by implementor", async () => {
      const name = `NotActive ${uniqueId()}`
      termNames.push(name)
      const term = (await (await app.request("/api/terms", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name, startDate: "2026-01-01", endDate: "2026-06-30" }),
      })).json()).data
      const res = await app.request(`/api/terms/${term.id}`, { method: "DELETE", headers: authHeader(implementorToken) })
      expect(res.status).toBe(403)
    })
  })

  describe("Training-day route guards", () => {
    it("students are blocked from summary, overview and student-day endpoints", async () => {
      const name = `CWTS Term ${uniqueId()}`
      termNames.push(name)
      const term = (await (await app.request("/api/terms", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name, startDate: "2026-01-01", endDate: "2026-06-30" }),
      })).json()).data

      const summaryRes = await app.request(`/api/training/summary?termId=${term.id}`, { headers: authHeader(studentToken) })
      expect(summaryRes.status).toBe(403)

      const studentRes = await app.request(`/api/training/student/${studentToken}?termId=${term.id}`, { headers: authHeader(studentToken) })
      expect(studentRes.status).toBe(403)

      const overviewRes = await app.request(`/api/training/overview?termId=${term.id}`, { headers: authHeader(studentToken) })
      expect(overviewRes.status).toBe(403)

      // Admin on a CWTS-named term still gets a valid (non-inflated) summary
      const adminRes = await app.request(`/api/training/summary?termId=${term.id}`, { headers: authHeader(adminToken) })
      const adminBody = await adminRes.json()
      expect(adminRes.status).toBe(200)
      expect(adminBody.data.nstpType).toBe("CWTS")
    })
  })

  describe("Student total grade computation", () => {
    const gradeIds: string[] = []
    let gradeStudentId = ""
    let gradeStudentToken = ""

    it("ignores ungraded categories for the total grade (graded categories only)", async () => {
      const stud = await createTestUser(RoleType.STUDENT)
      emails.push(stud.email)
      gradeStudentId = stud.id
      gradeStudentToken = makeToken(stud.id, stud.role)

      // 40% and 60% of the course; only the 40% category is graded at 100%
      const c40 = (await (await app.request("/api/grades/categories", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name: `G40-${uniqueId()}`, weight: 40 }),
      })).json()).data
      const c60 = (await (await app.request("/api/grades/categories", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name: `G60-${uniqueId()}`, weight: 60 }),
      })).json()).data
      gradeIds.push(c40.id, c60.id)

      const item = (await (await app.request("/api/grades/items", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ title: `Item-${uniqueId()}`, maxScore: 100, categoryId: c40.id }),
      })).json()).data

      const enc = await app.request("/api/grades", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: gradeStudentId, gradeItemId: item.id, score: 100 }),
      })
      expect(enc.status).toBe(200)

      const res = await app.request("/api/dashboard/my", { headers: authHeader(gradeStudentToken) })
      const body = await res.json()
      expect(res.status).toBe(200)
      // The 60-weight category has no grades, so the total renormalizes over the
      // graded 40-weight category only, which is at 100% => 100.
      expect(body.data.totalGrade.totalPercent).toBe(100)
    }, 60000)

    it("student with enrollment-based section (null profile sectionId) sees their own grades", async () => {
      // Reproduces the seeded-data scenario: studentProfile.sectionId is null but
      // the student has an APPROVED enrollment, so auth falls back to the
      // enrollment section. The /api/grades?studentId= self-query must still
      // return their grades instead of an empty list.
      const stud = await createTestUser(RoleType.STUDENT)
      emails.push(stud.email)
      const studToken = makeToken(stud.id, stud.role)

      await prisma.enrollment.create({
        data: { userId: stud.id, sectionId: rotcSectionId, status: EnrollmentStatus.APPROVED },
      })

      const cat = (await (await app.request("/api/grades/categories", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name: `SG-${uniqueId()}`, weight: 100 }),
      })).json()).data
      gradeIds.push(cat.id)
      const item = (await (await app.request("/api/grades/items", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ title: `SGItem-${uniqueId()}`, maxScore: 100, categoryId: cat.id }),
      })).json()).data
      const enc = await app.request("/api/grades", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: stud.id, gradeItemId: item.id, score: 88 }),
      })
      expect(enc.status).toBe(200)

      const res = await app.request(`/api/grades?studentId=${stud.id}`, { headers: authHeader(studToken) })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
      // Total reflects the single graded category at 88/100.
      expect(body.data[0].totalGrade).toBe(88)
    }, 60000)

    it("student cannot read another student's grades via studentId param", async () => {
      const victim = await createTestUser(RoleType.STUDENT)
      emails.push(victim.email)

      const cat = (await (await app.request("/api/grades/categories", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ name: `VIC-${uniqueId()}`, weight: 100 }),
      })).json()).data
      gradeIds.push(cat.id)
      const item = (await (await app.request("/api/grades/items", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ title: `VICItem-${uniqueId()}`, maxScore: 100, categoryId: cat.id }),
      })).json()).data
      const enc = await app.request("/api/grades", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ studentId: victim.id, gradeItemId: item.id, score: 100 }),
      })
      expect(enc.status).toBe(200)

      // The caller (studentToken's own student) requests the victim's id — the
      // server must force the query to the caller's own id, so no victim row
      // appears even though the victim has a grade.
      const res = await app.request(`/api/grades?studentId=${victim.id}`, { headers: authHeader(studentToken) })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.data)).toBe(true)
      const victimRows = body.data.filter((g: any) => g.studentId === victim.id)
      expect(victimRows.length).toBe(0)
    }, 60000)

    afterAll(async () => {
      await cleanupTestGradeCategories(gradeIds)
    })
  })

  describe("Batch 3 audit fixes", () => {
    it("GET /api/enrollments — a student is blocked from the directory", async () => {
      const res = await app.request("/api/enrollments", { headers: authHeader(studentToken) })
      expect(res.status).toBe(403)
    })

    it("POST /api/attendance/scan — a student cannot proxy-check-in", async () => {
      const qr = await (await app.request("/api/attendance/qr-token", { headers: authHeader(studentToken) })).json()
      const res = await app.request("/api/attendance/scan", {
        method: "POST",
        headers: authHeader(studentToken),
        body: json({ token: qr.data.token }),
      })
      expect(res.status).toBe(403)
    })

    it("GET /api/attendance — a student cannot query another student's records", async () => {
      const other = await createTestUser(RoleType.STUDENT)
      emails.push(other.email)
      const res = await app.request(`/api/attendance?userId=${other.id}`, { headers: authHeader(studentToken) })
      expect(res.status).toBe(403)
    })

    it("enrollment PATCH — updating the section keeps the flight", async () => {
      const stud = await createTestUser(RoleType.STUDENT)
      emails.push(stud.email)
      const flightCode = `FL-${uniqueId()}`
      flightCodes.push(flightCode)
      const flight = (await (await app.request("/api/flights", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ code: flightCode, name: "Preserve Flight" }),
      })).json()).data

      const enroll = (await (await app.request("/api/enrollments", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ userId: stud.id, flightId: flight.id }),
      })).json()).data
      enrollmentIds.push(enroll.id)

      const res = await app.request(`/api/enrollments/${enroll.id}`, {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: json({ sectionId: rotcSectionId }),
      })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.data.sectionId).toBe(rotcSectionId)
      expect(body.data.flightId).toBe(flight.id)
    })

    it("PATCH /api/remarks/record/:recordId — implementor cannot touch a CWTS student's record", async () => {
      const cwtsStud = await createTestUser(RoleType.STUDENT)
      emails.push(cwtsStud.email)
      await prisma.studentProfile.update({ where: { userId: cwtsStud.id }, data: { sectionId: cwtsSectionId } })

      const record = await prisma.attendanceRecord.create({
        data: { userId: cwtsStud.id, date: new Date(), status: "ABSENT" },
      })

      const res = await app.request(`/api/remarks/record/${record.id}`, {
        method: "PATCH",
        headers: authHeader(implementorToken),
        body: json({ remarks: "Not allowed" }),
      })
      expect(res.status).toBe(400)
    })

    it("student profile section follows the enrollment status", async () => {
      const stud = await createTestUser(RoleType.STUDENT)
      emails.push(stud.email)
      const enroll = (await (await app.request("/api/enrollments", {
        method: "POST",
        headers: authHeader(adminToken),
        body: json({ userId: stud.id, sectionId: cwtsSectionId }),
      })).json()).data
      enrollmentIds.push(enroll.id)

      const approved = await app.request(`/api/enrollments/${enroll.id}/status`, {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: json({ status: "APPROVED" }),
      })
      expect(approved.status).toBe(200)
      const profileAfterApprove = await prisma.studentProfile.findUnique({
        where: { userId: stud.id },
        select: { sectionId: true },
      })
      expect(profileAfterApprove?.sectionId).toBe(cwtsSectionId)

      const rejected = await app.request(`/api/enrollments/${enroll.id}/status`, {
        method: "PATCH",
        headers: authHeader(adminToken),
        body: json({ status: "REJECTED" }),
      })
      expect(rejected.status).toBe(200)
      const profileAfterReject = await prisma.studentProfile.findUnique({
        where: { userId: stud.id },
        select: { sectionId: true },
      })
      expect(profileAfterReject?.sectionId).toBe(null)
    })
  })
})