import { courseRepository } from "../repositories/courseRepository.js"
import { logAudit } from "./auditService.js"

export const MAX_SECTIONS_PER_COURSE = 50

export async function createCourse(code: string, name: string) {
  const course = await courseRepository.create({ code, name })
  await logAudit("CREATE", "Course", course.id)
  return course
}

export async function listCourses() {
  return courseRepository.list()
}

export async function getCourseById(id: string) {
  return courseRepository.getById(id)
}

export async function updateCourse(id: string, code: string, name: string) {
  const course = await courseRepository.update(id, { code, name })
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
