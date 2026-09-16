import { NstpType } from "@prisma/client"
import { courseRepository } from "../repositories/courseRepository.js"
import { MANDATORY_COURSES } from "../constants/programs.js"
import { logAudit } from "./auditService.js"

export const MAX_SECTIONS_PER_COURSE = 50

export async function createCourse(code: string, name: string, nstpType?: NstpType) {
  const course = await courseRepository.create({ code, name, nstpType })
  await logAudit("CREATE", "Course", course.id)
  return course
}

export async function listCourses(nstpType?: NstpType) {
  return courseRepository.list(nstpType)
}

export async function listMandatoryCourses(program?: NstpType) {
  if (program && program in MANDATORY_COURSES) {
    return { program, courses: MANDATORY_COURSES[program] }
  }
  return { program: null, courses: MANDATORY_COURSES }
}

export async function getCourseById(id: string) {
  return courseRepository.getById(id)
}

export async function updateCourse(id: string, code: string, name: string, nstpType?: NstpType) {
  const existing = await courseRepository.getById(id)
  if (!existing) throw new Error("Course not found")
  // Flipping the NSTP program of a course that already has sections would strand
  // those students in the wrong component — forbid it once any section exists.
  if (nstpType && existing.nstpType !== nstpType && existing.sections.length > 0) {
    throw new Error("Cannot change the NSTP program of a course that already has sections")
  }
  const course = await courseRepository.update(id, { code, name, nstpType })
  await logAudit("UPDATE", "Course", id)
  return course
}

export async function deleteCourse(id: string) {
  await courseRepository.delete(id)
  await logAudit("DELETE", "Course", id)
}

export async function countSectionsInCourse(courseId: string) {
  return courseRepository.countSections(courseId)
}
