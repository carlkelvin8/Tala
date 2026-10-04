// Import the Prisma client (used indirectly through composed services)
import { NstpType, RoleType } from "@prisma/client"
// Import existing scoped list services — the combined feed reuses them so
// visibility rules stay identical to the individual endpoints
import { listSessionsInRange } from "./attendanceSessionService.js"
import { listExamSessions } from "./examService.js"
import { listAnnouncements } from "./announcementService.js"
import { resolveScopeProgram } from "./programScope.js"

type CalendarUser = {
  id: string
  role: RoleType
  program?: NstpType | null
  sectionId?: string | null
  flightId?: string | null
}

/* Single round trip backing the calendar page: attendance sessions in range,
   visible exam sessions, and announcements with event dates. Visibility logic
   mirrors each source endpoint (student section/flight visibility, implementor
   program scope), so no permission behavior changes. Announcements are trimmed
   to the fields the calendar actually renders to keep the payload small. */
export async function getCalendarData(
  authUser: CalendarUser,
  filters: { from?: Date; to?: Date }
) {
  const scopeProgram = resolveScopeProgram(authUser)

  const examFilters =
    authUser.role === RoleType.STUDENT
      ? {
          studentVisibility: {
            sectionId: authUser.sectionId ?? undefined,
            flightId: authUser.flightId ?? undefined,
          },
        }
      : {
          ...(scopeProgram ? { program: scopeProgram } : {}),
        }

  const [sessions, exams, announcements] = await Promise.all([
    listSessionsInRange({ from: filters.from, to: filters.to }, scopeProgram),
    listExamSessions(examFilters),
    listAnnouncements({}, 0, 100, scopeProgram),
  ])

  return {
    sessions,
    exams,
    announcements: announcements.items.map((a) => ({
      id: a.id,
      title: a.title,
      eventDate: a.eventDate,
      program: a.program,
    })),
  }
}
