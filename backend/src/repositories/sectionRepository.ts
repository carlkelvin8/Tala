import { prisma } from "../lib/prisma.js"

export const sectionRepository = {
  create(data: { code: string; name: string }) {
    return prisma.section.create({ data })
  },
  list() {
    return prisma.section.findMany({ orderBy: { name: "asc" } })
  },
  update(id: string, data: { code: string; name: string }) {
    return prisma.section.update({ where: { id }, data })
  },
  delete(id: string) {
    return prisma.section.delete({ where: { id } })
  }
}
