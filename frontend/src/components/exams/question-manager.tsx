import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../../lib/api"
import { ApiResponse } from "../../types"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select } from "../ui/select"
import { Label } from "../ui/label"
import { Alert } from "../ui/alert"
import { EmptyState } from "../ui/empty-state"
import { Drawer } from "../ui/drawer"
import { toast } from "sonner"
import { ListChecks, Plus, Trash2, Type, ListOrdered } from "lucide-react"

type Question = {
  id: string
  type: "IDENTIFICATION" | "MULTIPLE_CHOICE"
  question: string
  options: string[] | null
  correctAnswer: string
  points: number
  order: number
}

type QuestionManagerProps = {
  session: { id: string; title: string; _count?: { questions?: number } }
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuestionsChange?: () => void
}

export function QuestionManager({ session, open, onOpenChange, onQuestionsChange }: QuestionManagerProps) {
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({
    type: "IDENTIFICATION" as "IDENTIFICATION" | "MULTIPLE_CHOICE",
    question: "",
    options: "",
    correctAnswer: "",
    points: 1,
  })

  const questionsQuery = useQuery({
    queryKey: ["exam-questions", session.id],
    queryFn: () => apiRequest<ApiResponse<Question[]>>(`/api/exams/${session.id}/questions`),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setAddMode(false)
      setForm({ type: "IDENTIFICATION", question: "", options: "", correctAnswer: "", points: 1 })
    }
  }, [open])

  const refresh = () => {
    questionsQuery.refetch()
    onQuestionsChange?.()
  }

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest<ApiResponse<Question>>(`/api/exams/${session.id}/questions`, {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          question: form.question,
          options: form.type === "MULTIPLE_CHOICE" ? form.options.split("\n").map((o) => o.trim()).filter(Boolean) : undefined,
          correctAnswer: form.correctAnswer.trim(),
          points: Number(form.points) || 1,
        }),
      }),
    onSuccess: () => {
      toast.success("Question added")
      setAddMode(false)
      setForm({ type: "IDENTIFICATION", question: "", options: "", correctAnswer: "", points: 1 })
      refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add question")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) =>
      apiRequest<ApiResponse<{ id: string }>>(`/api/exams/questions/${questionId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Question removed")
      refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove question")
    },
  })

  const submitAdd = () => {
    if (!form.question.trim()) {
      toast.error("Question text is required")
      return
    }
    if (!form.correctAnswer.trim()) {
      toast.error("Correct answer is required")
      return
    }
    if (form.type === "MULTIPLE_CHOICE") {
      const options = form.options.split("\n").map((o) => o.trim()).filter(Boolean)
      if (options.length < 2) {
        toast.error("Multiple choice requires at least 2 options (one per line)")
        return
      }
    }
    createMutation.mutate()
  }

  const questions = questionsQuery.data?.data ?? []
  const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={`Questions — ${session.title}`}>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-silver/30 px-4 py-3">
          <div className="text-xs text-darksilver">
            <span className="font-semibold text-black">{questions.length}</span> question{questions.length === 1 ? "" : "s"}
            {totalPoints > 0 && (
              <span className="ml-2">
                · <span className="font-semibold text-black">{totalPoints}</span> total pts
              </span>
            )}
          </div>
          {!addMode && (
            <Button size="sm" onClick={() => setAddMode(true)} className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </Button>
          )}
        </div>

        {addMode && (
          <div className="rounded-xl border border-silver/30 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-black">New Question</h4>
              <Button size="sm" variant="ghost" onClick={() => setAddMode(false)}>
                Cancel
              </Button>
            </div>
            <div>
              <Label htmlFor="q-type">Type</Label>
              <Select
                id="q-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "IDENTIFICATION" | "MULTIPLE_CHOICE" })}
              >
                <option value="IDENTIFICATION">Identification</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="q-text">Question</Label>
              <Textarea
                id="q-text"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="e.g. What is the capital of the Philippines?"
              />
            </div>
            {form.type === "MULTIPLE_CHOICE" && (
              <div>
                <Label htmlFor="q-options">Options (one per line)</Label>
                <Textarea
                  id="q-options"
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder={"AFPNORCOM\nDepEd\nDOH\nDSWD"}
                />
              </div>
            )}
            <div>
              <Label htmlFor="q-answer">Correct Answer</Label>
              {form.type === "MULTIPLE_CHOICE" ? (
                <Input
                  id="q-answer"
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  placeholder="e.g. AFPNORCOM"
                />
              ) : (
                <Input
                  id="q-answer"
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  placeholder="e.g. Manila"
                />
              )}
            </div>
            <div>
              <Label htmlFor="q-points">Points</Label>
              <Input
                id="q-points"
                type="number"
                min={1}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={submitAdd}
                disabled={createMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createMutation.isPending ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </div>
        )}

        {questionsQuery.isError && <Alert variant="danger">Unable to load questions.</Alert>}
        {questionsQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-silver/20" />
            ))}
          </div>
        ) : questions.length === 0 && !addMode ? (
          <EmptyState title="No questions yet" description="Add identification or multiple choice questions to this exam." />
        ) : (
          <div className="space-y-2">
            {questions.map((q, index) => (
              <div key={q.id} className="rounded-xl border border-silver/30 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {q.type === "MULTIPLE_CHOICE" ? (
                      <ListOrdered className="mt-0.5 h-4 w-4 text-royal" />
                    ) : (
                      <Type className="mt-0.5 h-4 w-4 text-royal" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-black">{index + 1}. {q.question}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            q.type === "MULTIPLE_CHOICE" ? "bg-royal/10 text-royal" : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {q.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "Identification"}
                        </span>
                        <span className="rounded-full bg-silver/20 px-2 py-0.5 text-[10px] font-semibold text-black/70">
                          {q.points} pt{q.points === 1 ? "" : "s"}
                        </span>
                      </div>
                      {q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) && (
                        <ul className="mt-2 space-y-0.5">
                          {q.options.map((option, optIndex) => (
                            <li key={optIndex} className="text-xs text-darksilver">
                              <span className="font-semibold text-black/70">{String.fromCharCode(65 + optIndex)}.</span>{" "}
                              {option}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-1.5 text-xs text-green-700">
                        Answer: <span className="font-semibold">{q.correctAnswer}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(q.id)}
                    disabled={deleteMutation.isPending}
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}

export function QuestionCountBadge({ count }: { count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-royal/10 px-2.5 py-1 text-xs font-semibold text-royal">
      <ListChecks className="h-3 w-3" />
      {count ?? 0} {count === 1 ? "question" : "questions"}
    </span>
  )
}