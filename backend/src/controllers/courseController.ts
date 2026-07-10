import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createCourse, listCourses, getCourseById, updateCourse, deleteCourse } from "../services/courseService.js"

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    const course = await createCourse(body.code, body.name)
    return c.json(ok("Course created", course))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function list(c: Context) {
  const courses = await listCourses()
  return c.json(ok("Courses fetched", courses))
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
    const id = c.req.param("id")
    const body = await c.req.json()
    const course = await updateCourse(id, body.code, body.name)
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
