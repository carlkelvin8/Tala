import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse, ProgramType } from "../types"
import { BookOpenCheck, Lock } from "lucide-react"
import { SectionCard } from "./ui/section-card"
import { LoadingSkeleton } from "./ui/loading-skeleton"
import { Alert } from "./ui/alert"
import { Badge } from "./ui/badge"
import { programFullLabels } from "../lib/programs"

export interface MandatoryCourse {
  code: string
  name: string
}

type MandatoryResponse = {
  program?: ProgramType | null
  courses: MandatoryCourse[] | Record<ProgramType, MandatoryCourse[]>
}

const GROUP_ORDER: ProgramType[] = ["CWTS", "ROTC"]

/* Render the fixed, read-only list of mandatory courses for a given program
   (or grouped across both programs when no program is specified). */
export function MandatoryCourses({ program }: { program?: ProgramType }) {
  const query = useQuery({
    queryKey: ["mandatory-courses", program ?? "all"],
    queryFn: () =>
      apiRequest<ApiResponse<MandatoryResponse>>(
        program ? `/api/courses/mandatory?program=${program}` : "/api/courses/mandatory"
      ),
    staleTime: 5 * 60 * 1000,
    retry: false
  })

  const data = query.data?.data
  const single = program && data && data.courses && Array.isArray(data.courses)
    ? (data.courses as MandatoryCourse[])
    : null
  const grouped = !program && data && data.courses && !Array.isArray(data.courses)
    ? (data.courses as Record<ProgramType, MandatoryCourse[]>)
    : null

  if (query.isError) {
    return (
      <SectionCard title="Mandatory Courses" description="Fixed curriculum per NSTP program">
        <Alert variant="danger">Unable to load mandatory courses.</Alert>
      </SectionCard>
    )
  }

  if (query.isLoading) {
    return (
      <SectionCard title="Mandatory Courses" description="Fixed curriculum per NSTP program">
        <LoadingSkeleton rows={3} columns={2} />
      </SectionCard>
    )
  }

  const renderList = (courses: MandatoryCourse[]) => (
    <ul className="space-y-2">
      {courses.map((course) => (
        <li
          key={course.code}
          className="flex items-center gap-3 rounded-xl border border-silver/20 bg-white px-4 py-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
            <BookOpenCheck className="h-4 w-4 text-royal" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-black">{course.name}</p>
            <p className="text-[10px] font-mono text-darksilver mt-0.5">{course.code}</p>
          </div>
          <Lock className="h-3.5 w-3.5 shrink-0 text-silver" />
        </li>
      ))}
    </ul>
  )

  if (grouped) {
    return (
      <SectionCard
        title="Mandatory Courses"
        description="Fixed curriculum per NSTP program"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {GROUP_ORDER.map((prog) => (
            <div key={prog}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-darksilver">
                  {programFullLabels[prog]}
                </p>
                <Badge variant="outline">{prog}</Badge>
              </div>
              {renderList(grouped[prog])}
            </div>
          ))}
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Mandatory Courses" description={`Fixed curriculum — ${programFullLabels[program ?? "CWTS"]}`}>
      {single ? renderList(single) : null}
    </SectionCard>
  )
}