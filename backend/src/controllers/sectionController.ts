import { Context } from "hono"
import { NstpType, RoleType } from "@prisma/client"
import { ok, fail } from "../lib/response.js"
import { prisma } from "../lib/prisma.js"
import { getAuthUser } from "../middlewares/auth.js"
import { createSection, listSections, updateSection, deleteSection, generateSections } from "../services/sectionService.js"

/* Implementors are scoped to their account program (default CWTS): sections must
   be tied to a course of their program, and existing section/course targets must
   already belong to that program. */
async function assertScopedCourse(c: Context, courseId?: string | null) {
  const authUser = getAuthUser(c)
  if (authUser.role !== RoleType.IMPLEMENTOR) return
  const program = authUser.program ?? NstpType.CWTS
  if (!courseId) {
    throw new Error("Implementors must scope sections to a course of their program")
  }
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { nstpType: true } })
  if (course && course.nstpType && course.nstpType !== program) {
    throw new Error(`Implementors can only create sections under ${program} courses (${course.nstpType} belongs to another program)`)
  }
  if (!course?.nstpType) {
    throw new Error("Course does not belong to a program")
  }
}

/* Implementors may only delete sections of their program */
async function assertScopedSection(c: Context, sectionId: string) {
  const authUser = getAuthUser(c)
  if (authUser.role !== RoleType.IMPLEMENTOR) return
  const program = authUser.program ?? NstpType.CWTS
  const section = await prisma.section.findUnique({ where: { id: sectionId }, select: { course: { select: { nstpType: true } } } })
  if (!section?.course?.nstpType || section.course.nstpType !== program) {
    throw new Error(`This section is not part of the ${program} program`)
  }
}

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    await assertScopedCourse(c, body.courseId)
    const section = await createSection(body.code, body.name, body.courseId)
    return c.json(ok("Section created", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function generate(c: Context) {
  try {
    const body = await c.req.json()
    await assertScopedCourse(c, body.courseId)
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
  // Implementors only see their program's sections
  const nstpType = authUser.role === RoleType.IMPLEMENTOR ? (authUser.program ?? NstpType.CWTS) : undefined
  const sections = await listSections(nstpType)
  return c.json(ok("Sections fetched", sections))
}

export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    // Implementors may only edit sections of their program
    if (getAuthUser(c).role === RoleType.IMPLEMENTOR) {
      await assertScopedSection(c, id)
    }
    await assertScopedCourse(c, body.courseId)
    const section = await updateSection(id, body)
    return c.json(ok("Section updated", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    // Implementors may only delete sections of their program
    await assertScopedSection(c, id)
    await deleteSection(id)
    return c.json(ok("Section deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
