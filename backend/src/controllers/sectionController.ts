import { Context } from "hono"
import { NstpType, RoleType } from "@prisma/client"
import { ok, fail } from "../lib/response.js"
import { prisma } from "../lib/prisma.js"
import { getAuthUser } from "../middlewares/auth.js"
import { createSection, listSections, updateSection, deleteSection, generateSections } from "../services/sectionService.js"

/* Implementors are locked to ROTC: sections must be tied to an ROTC course,
   and existing section/course targets must already belong to ROTC. */
async function assertRotcCourse(c: Context, courseId?: string | null) {
  const authUser = getAuthUser(c)
  if (authUser.role !== RoleType.IMPLEMENTOR) return
  if (!courseId) {
    throw new Error("Implementors must scope sections to an ROTC course")
  }
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { nstpType: true } })
  if (course && course.nstpType && course.nstpType !== NstpType.ROTC) {
    throw new Error(`Implementors can only create sections under ROTC courses (${course.nstpType} is locked to another program)`)
  }
  if (!course?.nstpType) {
    throw new Error("Course does not belong to a program")
  }
}

/* Implementors may only delete ROTC sections */
async function assertRotcSection(c: Context, sectionId: string) {
  const authUser = getAuthUser(c)
  if (authUser.role !== RoleType.IMPLEMENTOR) return
  const section = await prisma.section.findUnique({ where: { id: sectionId }, select: { course: { select: { nstpType: true } } } })
  if (!section?.course?.nstpType || section.course.nstpType !== NstpType.ROTC) {
    throw new Error("This section is not part of the ROTC program")
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
    // Implementors may only edit ROTC sections
    if (getAuthUser(c).role === RoleType.IMPLEMENTOR) {
      await assertRotcSection(c, id)
    }
    await assertRotcCourse(c, body.courseId)
    const section = await updateSection(id, body)
    return c.json(ok("Section updated", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    // Implementors may only delete ROTC sections
    await assertRotcSection(c, id)
    await deleteSection(id)
    return c.json(ok("Section deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
