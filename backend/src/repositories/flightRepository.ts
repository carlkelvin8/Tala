import { prisma } from "../lib/prisma.js"

export const flightRepository = {
  create(data: { code: string; name: string }) {
    return prisma.flight.create({ data })
  },
  list() {
    return prisma.flight.findMany({ orderBy: { name: "asc" } })
  },
  update(id: string, data: { code?: string; name?: string }) {
    return prisma.flight.update({ where: { id }, data })
  },
  delete(id: string) {
    return prisma.flight.delete({ where: { id } })
  }
}
