// Import the flight repository for database access to flight records
import { flightRepository } from "../repositories/flightRepository.js"
// Import the audit logging helper to record flight management events
import { logAudit } from "./auditService.js"

/* Create a new flight/group record */
export async function createFlight(code: string, name: string) {
  // Delegate to the repository to insert the new flight record
  const flight = await flightRepository.create({ code, name })
  // Log the flight creation event to the audit trail
  await logAudit("CREATE", "Flight", flight.id)
  // Return the created flight object
  return flight
}

/* Return all flight/group records ordered alphabetically by name */
export async function listFlights() {
  // Delegate to the repository to fetch all flights
  return flightRepository.list()
}

/* Update an existing flight's code and/or name */
export async function updateFlight(id: string, code?: string, name?: string) {
  // Delegate to the repository to update the flight record
  const flight = await flightRepository.update(id, { code, name })
  // Log the flight update event to the audit trail
  await logAudit("UPDATE", "Flight", flight.id)
  // Return the updated flight object
  return flight
}

/* Permanently delete a flight record */
export async function deleteFlight(id: string) {
  // Delegate to the repository to delete the flight record
  await flightRepository.delete(id)
  // Log the flight deletion event to the audit trail
  await logAudit("DELETE", "Flight", id)
}
