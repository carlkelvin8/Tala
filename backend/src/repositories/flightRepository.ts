// Import the shared Prisma client instance for database access
import { prisma } from "../lib/prisma.js"

/* Data-access object for the Flight model — all direct DB queries for flights/groups live here */
export const flightRepository = {
  /* Create a new flight record with a unique code and display name */
  create(data: { code: string; name: string }) {
    return prisma.flight.create({ data })
  },
  /* Return all flights ordered alphabetically by name */
  list() {
    return prisma.flight.findMany({ orderBy: { name: "asc" } })
  },
  /* Update the code and/or name of an existing flight identified by its ID */
  update(id: string, data: { code?: string; name?: string }) {
    return prisma.flight.update({ where: { id }, data })
  },
  /* Permanently delete a flight record by its ID */
  delete(id: string) {
    return prisma.flight.delete({ where: { id } })
  }
}
