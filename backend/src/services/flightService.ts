import { flightRepository } from "../repositories/flightRepository.js"
import { logAudit } from "./auditService.js"

export async function createFlight(code: string, name: string) {
  const flight = await flightRepository.create({ code, name })
  await logAudit("CREATE", "Flight", flight.id)
  return flight
}

export async function listFlights() {
  return flightRepository.list()
}

export async function updateFlight(id: string, code?: string, name?: string) {
  const flight = await flightRepository.update(id, { code, name })
  await logAudit("UPDATE", "Flight", flight.id)
  return flight
}

export async function deleteFlight(id: string) {
  await flightRepository.delete(id)
  await logAudit("DELETE", "Flight", id)
}
