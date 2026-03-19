// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating or updating a section record */
export const sectionSchema = z.object({
  code: z.string().min(2), // Short identifier code for the section (minimum 2 characters)
  name: z.string().min(2)  // Display name for the section (minimum 2 characters)
})
