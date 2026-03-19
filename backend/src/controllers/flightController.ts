// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the flight service functions for business logic
import { createFlight, listFlights, updateFlight, deleteFlight } from "../services/flightService.js"

/* POST /api/flights/ — create a new flight/group record */
export async function create(c: Context) {
  try {
    // Parse the JSON body containing the flight code and name
    const body = await c.req.json()
    // Delegate to the flight service to create the record and log the audit event
    const flight = await createFlight(body.code, body.name)
    // Return the created flight object
    return c.json(ok("Flight created", flight))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

/* GET /api/flights/ — return all flight/group records */
export async function list(c: Context) {
  // Delegate to the flight service to fetch all flights ordered by name
  const flights = await listFlights()
  // Return the list of flights
  return c.json(ok("Flights fetched", flights))
}

/* PATCH /api/flights/:id — update an existing flight's code and/or name */
export async function update(c: Context) {
  try {
    // Extract the flight ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the updated code and/or name
    const body = await c.req.json()
    // Delegate to the flight service to update the record and log the audit event
    const flight = await updateFlight(id, body.code, body.name)
    // Return the updated flight object
    return c.json(ok("Flight updated", flight))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/flights/:id — permanently delete a flight record */
export async function remove(c: Context) {
  try {
    // Extract the flight ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the flight service to delete the record and log the audit event
    await deleteFlight(id)
    // Return a success message with no data payload
    return c.json(ok("Flight deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
