import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createFlight, listFlights, updateFlight, deleteFlight } from "../services/flightService.js"

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    const flight = await createFlight(body.code, body.name)
    return c.json(ok("Flight created", flight))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function list(c: Context) {
  const flights = await listFlights()
  return c.json(ok("Flights fetched", flights))
}

export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const flight = await updateFlight(id, body.code, body.name)
    return c.json(ok("Flight updated", flight))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    await deleteFlight(id)
    return c.json(ok("Flight deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
