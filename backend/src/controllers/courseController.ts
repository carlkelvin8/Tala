import { Context } from "hono"
import { NstpType, RoleType } from "@prisma/client"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import { createCourse, listCourses, getCourseById, updateCourse, deleteCourse, listMandatoryCourses } from "../services/courseService.js"

export async function create(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    // Implementors are locked to CWTS — always create CWTS courses
    const nstpType = authUser.role === RoleType.IMPLEMENTOR ? NstpType.CWTS : (body.nstpType ?? undefined)
    const course = await createCourse(body.code, body.name, nstpType)
    return c.json(ok("Course created", course))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  // Implementors only see CWTS content
  const nstpType = authUser.role === RoleType.IMPLEMENTOR ? NstpType.CWTS : undefined
  const courses = await listCourses(nstpType)
  return c.json(ok("Courses fetched", courses))
}

export async function mandatory(c: Context) {
  const raw = c.req.query("program")
  const program = raw?.toUpperCase() === "ROTC" || raw?.toUpperCase() === "CWTS" ? (raw.toUpperCase() as NstpType) : undefined
  const result = await listMandatoryCourses(program)
  return c.json(ok("Mandatory courses fetched", result))
}

export async function getById(c: Context) {
  try {
    const id = c.req.param("id")
    const course = await getCourseById(id)
    if (!course) return c.json(fail("Course not found"), 404)
    return c.json(ok("Course fetched", course))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}

export async function update(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    // Implementors are locked to CWTS and cannot change a course's program to ROTC
    const nstpType = authUser.role === RoleType.IMPLEMENTOR ? NstpType.CWTS : (body.nstpType ?? undefined)
    const course = await updateCourse(id, body.code, body.name, nstpType)
    return c.json(ok("Course updated", course))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    await deleteCourse(id)
    return c.json(ok("Course deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
