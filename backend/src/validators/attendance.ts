// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for the attendance check-in request body */
export const attendanceCheckInSchema = z.object({
  latitude: z.number(),  // Student's current GPS latitude as a floating-point number
  longitude: z.number()  // Student's current GPS longitude as a floating-point number
})

/* Schema for the attendance check-out request body */
export const attendanceCheckOutSchema = z.object({
  latitude: z.number(),  // Student's GPS latitude at check-out time
  longitude: z.number()  // Student's GPS longitude at check-out time
})

/* Schema for query parameters when listing attendance records */
export const attendanceQuerySchema = z.object({
  date: z.string().optional(),                    // Filter by a specific date (ISO string)
  userId: z.string().uuid().optional(),           // Filter by a specific user's UUID
  sectionId: z.string().uuid().optional(),        // Filter by a specific section's UUID
  flightId: z.string().uuid().optional(),         // Filter by a specific flight/group's UUID
  page: z.string().optional(),                    // Page number for pagination (as string from query)
  pageSize: z.string().optional()                 // Number of items per page (as string from query)
})
