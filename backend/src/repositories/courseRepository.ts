import { prisma } from "../lib/prisma.js"

export const courseRepository = {
  create(data: { code: string; name: string }) {
    return prisma.course.create({ data })
  },
  list() {
    return prisma.course.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { sections: true } } }
    })
  },
  getById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: { sections: { orderBy: { name: "asc" } } }
    })
  },
  update(id: string, data: { code: string; name: string }) {
    return prisma.course.update({ where: { id }, data })
  },
  delete(id: string) {
    return prisma.course.delete({ where: { id } })
  },
  countSections(courseId: string) {
    return prisma.section.count({ where: { courseId } })
  }
}
