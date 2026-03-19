// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating or updating a flight/group record */
export const flightSchema = z.object({
  code: z.string().min(2), // Short identifier code for the flight (minimum 2 characters)
  name: z.string().min(2)  // Display name for the flight (minimum 2 characters)
})
