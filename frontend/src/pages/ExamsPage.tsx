import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { QuestionManager, QuestionCountBadge } from "../components/exams/question-manager"
import { getStoredUser } from "../lib/auth"
import { FileText, Sparkles, Clock, Plus, X, RefreshCw, ListChecks } from "lucide-react"
import { motion } from "framer-motion"

export function ExamsPage() {
  const user = getStoredUser()
  const isAdminOrImplementor = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR"
  const isStudent = user?.role === "STUDENT"

  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({ title: "", scheduledAt: "", durationMin: 60 })
  const [managingSession, setManagingSession] = useState<any | null>(null)

  const sessionsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/exams"),
    refetchInterval: 30000
  })

  const myAttemptsQuery = useQuery({
    queryKey: ["exam-attempts"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/exams/attempts"),
    enabled: isStudent
  })

  const attemptMutation = useMutation({
    mutationFn: (examSessionId: string) =>
      apiRequest<ApiResponse<any>>("/api/exams/attempts", {
        method: "POST",
        body: JSON.stringify({ examSessionId })
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to start coursework")
    }
  })

  const createExamMutation = useMutation({
    mutationFn: (values: { title: string; scheduledAt: string; durationMin: number }) =>
      apiRequest<ApiResponse<any>>("/api/exams", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: () => {
      toast.success("Coursework created")
      setShowCreateForm(false)
      setCreateForm({ title: "", scheduledAt: "", durationMin: 60 })
      sessionsQuery.refetch()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create coursework")
    }
  })

  useEffect(() => {
    if (!running || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [running, timeLeft])

  useEffect(() => {
    if (running && timeLeft <= 0 && currentAttemptId) {
      setRunning(false)
      toast.warning("Time's up! Auto-submitting your coursework...")
      apiRequest(`/api/exams/attempts/${currentAttemptId}/finish`, { method: "POST" })
        .then(() => {
          toast.success("Coursework submitted successfully")
          setCurrentAttemptId(null)
          sessionsQuery.refetch()
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Failed to submit coursework")
        })
    }
  }, [timeLeft, running, currentAttemptId])

  const startExam = async (durationMin: number, examSessionId: string) => {
    try {
      const result = await attemptMutation.mutateAsync(examSessionId)
      // Never start the countdown unless the server returned a real attempt id —
      // an in-flight attempt that can never be submitted would strand the student.
      if (!result.data?.id) {
        toast.error("Unable to start the coursework attempt. Please try again.")
        return
      }
      setCurrentAttemptId(result.data.id)
      setTimeLeft(durationMin * 60)
      setRunning(true)
      toast.success("Coursework started — timer is now counting down")
    } catch {
    }
  }

  const finishExam = async () => {
    if (!currentAttemptId) return
    try {
      await apiRequest(`/api/exams/attempts/${currentAttemptId}/finish`, { method: "POST" })
      toast.success("Coursework submitted successfully")
      setCurrentAttemptId(null)
      setRunning(false)
      sessionsQuery.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit coursework")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const rows = sessionsQuery.data?.data ?? []
  const columns = [
    {
      header: "Title",
      cell: (session: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal/10">
            <FileText className="h-4 w-4 text-royal" />
          </div>
          <div className="min-w-0">
            <span className="block font-semibold text-black">{session.title}</span>
            {isAdminOrImplementor && (
              <span className="mt-0.5 block">
                <QuestionCountBadge count={session._count?.questions} />
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: "Schedule",
      cell: (session: any) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-darksilver" />
          <span className="text-sm text-darksilver">{new Date(session.scheduledAt).toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Duration",
      cell: (session: any) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-silver/20 px-2.5 py-1 text-xs font-medium text-black/80">
          <Clock className="h-3 w-3" />
          {session.durationMin} mins
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-card"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <motion.div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <motion.div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.div
              className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              <span>Coursework Proctoring</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Exams
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Monitor and launch timed supervised exams.
            </motion.p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      >
      {running && (
      <SectionCard title="Active Coursework" description="Timer and submission for your current attempt" className="shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-royal/10 px-4 py-1.5">
            <Clock className="h-4 w-4 text-royal" />
            <span className="text-sm font-semibold text-royal">
              Time Remaining: {formatTime(Math.max(timeLeft, 0))}
            </span>
          </div>

          {currentAttemptId && (
            <Button onClick={finishExam} variant="outline" className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
              Submit Exam
            </Button>
          )}
        </div>

        {attemptMutation.isError && (
          <Alert variant="danger" className="mt-4">
            Unable to start the exam attempt. Please try again.
          </Alert>
        )}
      </SectionCard>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
      >
      <SectionCard title="Courseworks" description="Upcoming courseworks and availability" className="shadow-card">
        {isAdminOrImplementor && (
          <div className="mb-4 flex items-center justify-between">
            <div />
            <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 bg-gradient-to-r from-navy to-royal hover:from-royal hover:to-navy text-white">
              {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreateForm ? "Cancel" : "Create Coursework"}
            </Button>
          </div>
        )}

        {showCreateForm && isAdminOrImplementor && (
          <div className="mb-6 rounded-xl border border-silver/30 bg-slate-50 dark:bg-slate-800/60 p-5">
            <h4 className="text-sm font-semibold text-black mb-4">New Coursework</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-darksilver mb-1 block">Title</label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Midterm Coursework"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-darksilver mb-1 block">Scheduled At</label>
                <Input
                  type="datetime-local"
                  value={createForm.scheduledAt}
                  onChange={(e) => setCreateForm({ ...createForm, scheduledAt: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-darksilver mb-1 block">Duration (minutes)</label>
                <Input
                  type="number"
                  min={1}
                  value={createForm.durationMin}
                  onChange={(e) => setCreateForm({ ...createForm, durationMin: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => createExamMutation.mutate(createForm)}
                disabled={!createForm.title || !createForm.scheduledAt || createExamMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createExamMutation.isPending ? "Creating..." : "Create Coursework"}
              </Button>
            </div>
          </div>
        )}

        {sessionsQuery.isError && <Alert variant="danger">Unable to load courseworks.</Alert>}
        {sessionsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={3} />
        ) : rows.length === 0 ? (
          <EmptyState title="No courseworks scheduled" description="Create a coursework to begin monitoring." />
        ) : (
          <ResponsiveTableCards
            data={rows}
            columns={columns}
            rowKey={(session) => session.id}
            renderTitle={(session) => session.title}
            renderActions={(session) => (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {isAdminOrImplementor && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setManagingSession(session)}
                    className="flex items-center gap-1.5"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    Questions
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => startExam(session.durationMin, session.id)}
                  disabled={running}
                >
                  {running ? "In Progress" : "Start Coursework"}
                </Button>
              </div>
            )}
          />
        )}
      </SectionCard>

      {isStudent && (
        <SectionCard title="My Coursework Results" description="View your past coursework attempts and scores" className="shadow-card">
          {myAttemptsQuery.isLoading ? (
            <LoadingSkeleton rows={3} columns={4} />
          ) : (myAttemptsQuery.data?.data ?? []).length === 0 ? (
            <EmptyState title="No coursework attempts yet" description="Start a coursework above to see your results here." />
          ) : (
            <ResponsiveTableCards
              data={myAttemptsQuery.data?.data ?? []}
              columns={[
                { header: "Coursework", cell: (a: any) => <span className="font-semibold text-black">{a.examSession?.title ?? "—"}</span> },
                { header: "Started", cell: (a: any) => <span className="text-sm text-darksilver">{new Date(a.startedAt).toLocaleString()}</span> },
                { header: "Duration", cell: (a: any) => {
                  const end = a.endedAt ? new Date(a.endedAt) : null
                  if (!end) return <span className="text-sm text-darksilver">In progress</span>
                  const mins = Math.round((end.getTime() - new Date(a.startedAt).getTime()) / 60000)
                  return <span className="text-sm text-darksilver">{mins}m</span>
                }},
                {
                  header: "Status",
                  cell: (a: any) => {
                    const finished = !!a.endedAt
                    return (
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      finished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {finished ? "Completed" : "In Progress"}
                    </span>
                  )},
                }
              ]}
              rowKey={(a: any) => a.id}
              renderTitle={(a: any) => a.examSession?.title ?? "Coursework Attempt"}
            />
          )}
        </SectionCard>
      )}
      </motion.div>
      </motion.div>

      {managingSession && (
        <QuestionManager
          key={managingSession.id}
          session={managingSession}
          open={!!managingSession}
          onOpenChange={(open) => {
            if (!open) setManagingSession(null)
          }}
          onQuestionsChange={() => sessionsQuery.refetch()}
        />
      )}
    </div>
  )
}
