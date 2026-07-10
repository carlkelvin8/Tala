import { prisma } from "../lib/prisma.js"

export const sectionRepository = {
  create(data: { code: string; name: string; courseId?: string | null }) {
    return prisma.section.create({ data })
  },
  list() {
    return prisma.section.findMany({
      orderBy: { name: "asc" },
      include: { course: true }
    })
  },
  update(id: string, data: { code: string; name: string; courseId?: string | null }) {
    return prisma.section.update({ where: { id }, data })
  },
  delete(id: string) {
    return prisma.section.delete({ where: { id } })
  }
}
