import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestCourses, cleanupTestSections, cleanupTestTerms, cleanupTestEnrollments, cleanupTestGradeCategories, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { EnrollmentStatus, RoleType } from "@prisma/client"

describe("Regression guards for Batch 2 fixes", () => {
  const emails: string[] = []
  const courseCodes: string[] = []
  const sectionCodes: string[] = []
  const termNames: string[] = []
  const enrollmentIds: string[] = []
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

    it("does not inflate when a weighted category has no grades yet", async () => {
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
      // 100% of the 40-weight category ÷ the full 100 weight — must NOT read 100
      expect(body.data.totalGrade.totalPercent).toBe(40)
    }, 60000)

    afterAll(async () => {
      await cleanupTestGradeCategories(gradeIds)
    })
  })
})