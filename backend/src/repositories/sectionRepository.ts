// Import the shared Prisma client instance for database access
import { prisma } from "../lib/prisma.js"

/* Data-access object for the Section model — all direct DB queries for sections live here */
export const sectionRepository = {
  /* Create a new section record with a unique code and display name */
  create(data: { code: string; name: string }) {
    return prisma.section.create({ data })
  },
  /* Return all sections ordered alphabetically by name */
  list() {
    return prisma.section.findMany({ orderBy: { name: "asc" } })
  },
  /* Update the code and name of an existing section identified by its ID */
  update(id: string, data: { code: string; name: string }) {
    return prisma.section.update({ where: { id }, data })
  },
  /* Permanently delete a section record by its ID */
  delete(id: string) {
    return prisma.section.delete({ where: { id } })
  }
}
