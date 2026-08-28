import { Context } from "hono"
import { NstpType, RoleType } from "@prisma/client"
import { ok, fail } from "../lib/response.js"
import { prisma } from "../lib/prisma.js"
import { getAuthUser } from "../middlewares/auth.js"
import { createSection, listSections, updateSection, deleteSection, generateSections } from "../services/sectionService.js"

/* Implementors are locked to ROTC — a section can only be tied to an ROTC course */
async function assertRotcCourse(c: Context, courseId?: string | null) {
  if (!courseId) return
  const authUser = getAuthUser(c)
  if (authUser.role !== RoleType.IMPLEMENTOR) return
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { nstpType: true } })
  if (course && course.nstpType && course.nstpType !== NstpType.ROTC) {
    throw new Error(`Implementors can only create sections under ROTC courses (${course.nstpType} is locked to another program)`)
  }
}

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    await assertRotcCourse(c, body.courseId)
    const section = await createSection(body.code, body.name, body.courseId)
    return c.json(ok("Section created", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function generate(c: Context) {
  try {
    const body = await c.req.json()
    await assertRotcCourse(c, body.courseId)
    const sections = await generateSections(
      body.prefix,
      body.start,
      body.end,
      body.courseId,
      body.separator
    )
    return c.json(ok(`${sections.length} sections generated`, sections))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Generation failed"), 400)
  }
}

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  // Implementors only see ROTC sections
  const nstpType = authUser.role === RoleType.IMPLEMENTOR ? NstpType.ROTC : undefined
  const sections = await listSections(nstpType)
  return c.json(ok("Sections fetched", sections))
}

export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    await assertRotcCourse(c, body.courseId)
    const section = await updateSection(id, body.code, body.name, body.courseId)
    return c.json(ok("Section updated", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    await deleteSection(id)
    return c.json(ok("Section deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
