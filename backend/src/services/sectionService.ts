import { NstpType } from "@prisma/client"
import { sectionRepository } from "../repositories/sectionRepository.js"
import { logAudit } from "./auditService.js"
import { countSectionsInCourse, MAX_SECTIONS_PER_COURSE } from "./courseService.js"

export async function createSection(code: string, name: string, courseId?: string | null) {
  if (courseId) {
    const count = await countSectionsInCourse(courseId)
    if (count >= MAX_SECTIONS_PER_COURSE) {
      throw new Error(`Course has reached the maximum of ${MAX_SECTIONS_PER_COURSE} sections`)
    }
  }
  const section = await sectionRepository.create({ code, name, courseId: courseId ?? null })
  await logAudit("CREATE", "Section", section.id)
  return section
}

export async function generateSections(
  prefix: string,
  start: number,
  end: number,
  courseId: string,
  separator: string = "-"
) {
  const count = await countSectionsInCourse(courseId)
  const requested = end - start + 1
  if (count + requested > MAX_SECTIONS_PER_COURSE) {
    throw new Error(
      `Cannot generate ${requested} sections: course already has ${count} sections (max ${MAX_SECTIONS_PER_COURSE})`
    )
  }

  const created = []
  for (let i = start; i <= end; i++) {
    const code = `${prefix}${separator}${String(i).padStart(2, "0")}`
    const name = `${prefix} ${i}`
    const section = await sectionRepository.create({ code, name, courseId })
    await logAudit("CREATE", "Section", section.id)
    created.push(section)
  }
  return created
}

export async function listSections(nstpType?: NstpType) {
  return sectionRepository.list(nstpType)
}

export async function updateSection(id: string, data: { code?: string; name?: string; courseId?: string | null }) {
  // Read the current section so a PATCH without courseId never wipes the course link
  const existing = await sectionRepository.getById(id)
  if (!existing) throw new Error("Section not found")
  const patch: { code?: string; name?: string; courseId?: string | null } = {}
  if (data.code !== undefined) patch.code = data.code
  if (data.name !== undefined) patch.name = data.name
  if (data.courseId !== undefined) patch.courseId = data.courseId

  const targetCourseId = patch.courseId !== undefined ? patch.courseId : existing.courseId
  if (targetCourseId) {
    const count = await countSectionsInCourse(targetCourseId)
    if (count >= MAX_SECTIONS_PER_COURSE) {
      throw new Error(`Course has reached the maximum of ${MAX_SECTIONS_PER_COURSE} sections`)
    }
  }
  const section = await sectionRepository.update(id, patch)
  await logAudit("UPDATE", "Section", id)
  return section
}

export async function deleteSection(id: string) {
  const existing = await sectionRepository.getById(id)
  if (!existing) throw new Error("Section not found")
  await sectionRepository.delete(id)
  await logAudit("DELETE", "Section", id)
}
