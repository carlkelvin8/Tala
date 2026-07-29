import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { Select } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { getAccessToken } from "../lib/auth"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { getFullName, getApiFileUrl } from "../lib/display"
import { useRef, useState, useMemo } from "react"
import { Drawer } from "../components/ui/drawer"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { Paperclip, X, FileText, ExternalLink, Edit, Trash2, Upload, BookOpen, BookMarked, Megaphone, ClipboardList, FileImage, File, Search, Clock, Sparkles } from "lucide-react"
import { usePermissions } from "../hooks/usePermissions"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg"]

function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "Only PDF, DOCX, and JPG files are allowed"
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`
  }
  return null
}

function getFileIcon(fileUrl: string | null) {
  if (!fileUrl) return null
  const ext = fileUrl.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return { icon: FileText, color: "text-red-500", bg: "bg-red-50", label: "PDF" }
  if (ext === "docx") return { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", label: "DOCX" }
  if (["jpg", "jpeg"].includes(ext || "")) return { icon: FileImage, color: "text-emerald-500", bg: "bg-emerald-50", label: "IMG" }
  return { icon: File, color: "text-darksilver", bg: "bg-white", label: ext?.toUpperCase() || "FILE" }
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]),
})
type FormValues = z.infer<typeof schema>

const CATEGORIES = ["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"] as const

const categoryMeta: Record<string, { label: string; icon: typeof BookOpen; color: string; bg: string; dot: string }> = {
  MODULE:       { label: "Module",       icon: BookMarked,   color: "text-violet-600",  bg: "bg-violet-50",   dot: "bg-violet-500" },
  LECTURE:      { label: "Lecture",      icon: BookOpen,     color: "text-royal",     bg: "bg-sky-50",      dot: "bg-sky-500" },
  ANNOUNCEMENT: { label: "Announcement", icon: Megaphone,    color: "text-amber-600",   bg: "bg-amber-50",    dot: "bg-amber-500" },
  ACTIVITY:     { label: "Activity",     icon: ClipboardList,color: "text-emerald-600",  bg: "bg-emerald-50",  dot: "bg-emerald-500" },
}

export function MaterialsPage() {
  const perms = usePermissions()
  const canManage = perms.canEdit || perms.canDelete
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState<string>("MODULE")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editFileUrl, setEditFileUrl] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "MODULE" },
  })

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/materials"),
    refetchInterval: 5000
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues & { fileUrl?: string }) =>
      apiRequest<ApiResponse<any>>("/api/materials", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      materialsQuery.refetch()
      toast.success("Material saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save material")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/materials/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      materialsQuery.refetch()
      toast.success("Material updated")
      setEditingMaterial(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/materials/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      materialsQuery.refetch()
      toast.success("Material deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsUploading(true)
    try {
      let fileUrl: string | undefined
      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        const token = getAccessToken()
        const base = import.meta.env.VITE_API_URL ?? ""
        const res = await fetch(`${base}/api/materials/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.message ?? "File upload failed")
        }
        const json = await res.json()
        fileUrl = json.data?.fileUrl
      }
      await mutation.mutateAsync({ ...values, fileUrl })
      form.reset({ title: "", description: "", category: "MODULE" })
      setSelectedFile(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit material")
    } finally {
      setIsUploading(false)
    }
  })

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setEditTitle(material.title)
    setEditDescription(material.description || "")
    setEditCategory(material.category)
    setEditFileUrl(material.fileUrl || null)
    setEditFile(null)
  }

  const handleSaveEdit = async () => {
    if (!editingMaterial) return
    setIsUploading(true)
    try {
      let fileUrl = editFileUrl
      if (editFile) {
        const formData = new FormData()
        formData.append("file", editFile)
        const token = getAccessToken()
        const base = import.meta.env.VITE_API_URL ?? ""
        const res = await fetch(`${base}/api/materials/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.message ?? "File upload failed")
        }
        const json = await res.json()
        fileUrl = json.data?.fileUrl
      }
      await updateMutation.mutateAsync({
        id: editingMaterial.id,
        data: {
          title: editTitle,
          description: editDescription,
          category: editCategory,
          fileUrl,
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update material")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = (material: any) => {
    setDeletingMaterial(material)
  }

  const confirmDelete = () => {
    if (deletingMaterial) {
      deleteMutation.mutate(deletingMaterial.id)
      setDeletingMaterial(null)
    }
  }

  const handleViewFile = (fileUrl: string) => {
    const url = getApiFileUrl(fileUrl)
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const rows = materialsQuery.data?.data ?? []

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length }
    for (const cat of CATEGORIES) counts[cat] = 0
    for (const m of rows) {
      if (categoryMeta[m.category]) counts[m.category] = (counts[m.category] || 0) + 1
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    let result = categoryFilter === "ALL" ? rows : rows.filter((m: any) => m.category === categoryFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((m: any) =>
        m.title.toLowerCase().includes(q) ||
        (m.description?.toLowerCase() || "").includes(q)
      )
    }
    return result
  }, [rows, categoryFilter, searchQuery])

  const columns = [
    {
      header: "Title",
      cell: (m: any) => {
        const cat = categoryMeta[m.category]
        const Icon = cat?.icon ?? FileText
        return (
          <div className="flex items-center gap-3">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", cat?.bg ?? "bg-white")}>
              <Icon className={cn("h-4.5 w-4.5", cat?.color ?? "text-darksilver")} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">{m.title}</p>
              {m.description && (
                <p className="text-xs text-darksilver truncate mt-0.5 max-w-[240px]">{m.description}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: "Category",
      cell: (m: any) => {
        const cat = categoryMeta[m.category]
        return (
          <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap", cat?.bg ?? "bg-white", cat?.color ?? "text-darksilver")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cat?.dot ?? "bg-darksilver")} />
            {cat?.label ?? m.category}
          </span>
        )
      },
    },
    {
      header: "Created By",
      cell: (m: any) => (
        <div className="leading-tight">
          <p className="text-sm font-medium text-black">{getFullName(m.createdBy)}</p>
          {m.createdBy?.email && (
            <p className="text-xs text-darksilver">{m.createdBy.email}</p>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (m: any) => (
        <div className="flex items-center gap-1.5 text-sm text-darksilver whitespace-nowrap">
          <Clock className="h-3.5 w-3.5 text-darksilver shrink-0" />
          <span title={new Date(m.createdAt).toLocaleString()}>
            {m.createdAt ? relativeTime(m.createdAt) : "—"}
          </span>
        </div>
      ),
    },
    {
      header: "File",
      cell: (m: any) => {
        if (!m.fileUrl) {
          return <span className="text-xs text-darksilver">—</span>
        }
        const fileInfo = getFileIcon(m.fileUrl)
        const ExtIcon = fileInfo?.icon ?? File
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewFile(m.fileUrl)}
              className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors", fileInfo?.bg ?? "bg-white", fileInfo?.color ?? "text-darksilver", "hover:brightness-90")}
            >
              <ExtIcon className="h-3.5 w-3.5" strokeWidth={2} />
              {fileInfo?.label}
            </button>
          </div>
        )
      },
    },
    ...(canManage ? [{
      header: "",
      cell: (m: any) => (
        <div className="flex gap-1">
          {perms.canEdit && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(m)} className="h-8 w-8 p-0" title="Edit">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {perms.canDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(m)}
              disabled={deleteMutation.isPending}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    }] : []),
  ]

  const editingCat = editingMaterial ? categoryMeta[editingMaterial.category] : null

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated"
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
            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>NSTP Learning Resources</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Learning Materials
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Publish, organize, and review NSTP learning resources.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {perms.canCreate && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
        >
        <FormSection
          title="Upload Learning Material"
          description="Share modules, lectures, and activities with students"
          className="shadow-card"
        >
          <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Title" required error={form.formState.errors.title?.message} className="md:col-span-2">
              <Input placeholder="e.g. NSTP Orientation Module 1" {...form.register("title")} className="h-11" />
            </FormField>

            <FormField label="Category" required>
              <Select {...form.register("category")} className="h-11">
                <option value="MODULE">Module</option>
                <option value="LECTURE">Lecture</option>
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="ACTIVITY">Activity</option>
              </Select>
            </FormField>

            <FormField label="Attachment" hint="PDF, DOCX, or JPG (max 10 MB)">
              <div
                className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-silver/40 bg-white px-4 text-sm text-darksilver transition-all hover:border-silver/50 hover:bg-silver/10"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    {(() => {
                      const ext = selectedFile.name.split(".").pop()?.toLowerCase()
                      if (ext === "pdf") return <FileText className="h-4 w-4 shrink-0 text-red-400" />
                      if (ext === "docx") return <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                      if (["jpg", "jpeg"].includes(ext || "")) return <FileImage className="h-4 w-4 shrink-0 text-emerald-400" />
                      return <Paperclip className="h-4 w-4 shrink-0" />
                    })()}
                    <span className="flex-1 truncate text-black/80">{selectedFile.name}</span>
                    <button
                      type="button"
                      className="text-darksilver hover:text-red-500 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4 shrink-0" />
                    <span>Choose file…</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const error = validateFile(file)
                    if (error) { toast.error(error); return }
                  }
                  setSelectedFile(file ?? null)
                }}
              />
            </FormField>

            <FormField label="Description" className="md:col-span-2">
              <Textarea placeholder="Add a brief description for students" {...form.register("description")} className="min-h-[80px]" />
            </FormField>

            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={mutation.isPending || isUploading}
                className="h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </span>
                ) : mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Save Material
                  </span>
                )}
              </Button>
            </div>
          </form>
        </FormSection>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
      >
      <SectionCard
        title="Materials"
        description="Latest uploads and announcements"
        className="shadow-card"
      >
        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 px-6 pt-2">
              {CATEGORIES.map((cat) => {
                const meta = categoryMeta[cat]
                const count = categoryCounts[cat] || 0
                const isActive = categoryFilter === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(isActive ? "ALL" : cat)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? `${meta.bg} ${meta.color} ring-1 ring-inset ring-silver/30`
                        : "bg-white text-darksilver hover:bg-silver/20 hover:text-black/80"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                    <span className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-white/60" : "bg-white"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="px-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>
        )}

        {materialsQuery.isError && (
          <div className="px-6 pt-4">
            <Alert variant="danger">Unable to load materials.</Alert>
          </div>
        )}

        <div className="px-6 pt-3 pb-2">
          {materialsQuery.isLoading ? (
            <LoadingSkeleton rows={3} columns={4} />
          ) : rows.length === 0 ? (
            <div className="py-4">
              <EmptyState title="No materials yet" description="Upload a new learning resource to get started." />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-4">
              <EmptyState
                title="No results found"
                description={searchQuery ? "Try a different search term." : "No materials in this category."}
              />
            </div>
          ) : (
            <ResponsiveTableCards
              data={filteredRows}
              columns={columns}
              rowKey={(m) => m.id}
              renderTitle={(m) => m.title}
            />
          )}
        </div>
      </SectionCard>
      </motion.div>

      <Drawer
        open={!!editingMaterial}
        onOpenChange={(open) => !open && setEditingMaterial(null)}
        title="Edit Learning Material"
      >
        {editingCat && (
          <div className={cn("h-1 w-full", editingCat.bg)} />
        )}
        <div className="p-4 space-y-5">
          {editingMaterial && (
            <div className="flex items-center gap-3 pb-2 border-b border-silver/20">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", editingCat?.bg ?? "bg-white")}>
                {editingCat && <editingCat.icon className={cn("h-5 w-5", editingCat.color)} strokeWidth={1.75} />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingMaterial.title}</p>
                <p className="text-xs text-darksilver">{editingCat?.label ?? editingMaterial.category}</p>
              </div>
            </div>
          )}

          <FormField label="Title" required>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. NSTP Orientation Module 1"
              className="h-11"
            />
          </FormField>

          <FormField label="Category" required>
            <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="h-11">
              <option value="MODULE">Module</option>
              <option value="LECTURE">Lecture</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="ACTIVITY">Activity</option>
            </Select>
          </FormField>

          <FormField label="Attachment" hint="PDF, DOCX, or JPG (max 10 MB)">
            <div
              className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-silver/40 bg-white px-4 text-sm text-darksilver transition-all hover:border-silver/50 hover:bg-silver/10"
              onClick={() => editFileInputRef.current?.click()}
            >
              {editFile ? (
                <>
                  <FileText className="h-4 w-4 shrink-0 text-sky-500" />
                  <span className="flex-1 truncate text-black/80">{editFile.name}</span>
                  <button
                    type="button"
                    className="text-darksilver hover:text-red-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setEditFile(null) }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : editFileUrl ? (
                <>
                  <FileText className="h-4 w-4 shrink-0 text-sky-500" />
                  <span className="flex-1 truncate text-black/80">Current file attached</span>
                  <button
                    type="button"
                    className="text-royal hover:text-sky-700 text-xs font-medium shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleViewFile(editFileUrl) }}
                  >
                    View
                  </button>
                </>
              ) : (
                <>
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span>Choose file…</span>
                </>
              )}
            </div>
            <input
              ref={editFileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const error = validateFile(file)
                  if (error) { toast.error(error); return }
                }
                setEditFile(file ?? null)
              }}
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add a brief description for students"
              className="min-h-[80px]"
            />
          </FormField>

          {updateMutation.isError && (
            <Alert variant="danger">
              {(updateMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || isUploading || !editTitle}
              className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black"
            >
              {isUploading ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingMaterial(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deletingMaterial}
        onOpenChange={(open) => !open && setDeletingMaterial(null)}
        title="Delete Material"
        description={`Are you sure you want to delete "${deletingMaterial?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}
