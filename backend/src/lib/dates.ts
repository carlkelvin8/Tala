/* Normalize a timestamp to the UTC midnight of its calendar day. Attendance
   records and sessions key off a plain calendar date; using UTC components keeps
   the derived value identical regardless of the server's local timezone so the
   @@unique([userId, date]) constraint behaves consistently across environments. */
export function utcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/* Parse a "YYYY-MM-DD" string as a UTC date (matching Prisma/PostgreSQL date
   handling used when sessions store their plain calendar date). */
export function parseUtcDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(value)
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}