import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { Select } from "../components/ui/select"
import { getStoredUser, getAccessToken } from "../lib/auth"
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
import { useRef, useState } from "react"
import { Drawer } from "../components/ui/drawer"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { Paperclip, X, FileText, ExternalLink, Edit, Trash2, Eye } from "lucide-react"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]),
})
type FormValues = z.infer<typeof schema>

const categoryColors: Record<string, string> = {
  MODULE:       "bg-violet-50 text-violet-700",
  LECTURE:      "bg-sky-50 text-sky-700",
  ANNOUNCEMENT: "bg-amber-50 text-amber-700",
  ACTIVITY:     "bg-emerald-50 text-emerald-700",
}

export function MaterialsPage() {
  const user = getStoredUser()
  const canManage = user?.role !== "STUDENT"
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

  const columns = [
    {
      header: "Title",
      cell: (m: any) => (
        <div className="flex items-center gap-2">
          {m.fileUrl && (
            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
          )}
          <span className="font-medium text-slate-900">{m.title}</span>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (m: any) => (
        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${categoryColors[m.category] ?? "bg-slate-50 text-slate-600"}`}>
          {m.category}
        </span>
      ),
    },
    {
      header: "Created By",
      cell: (m: any) => (
        <div className="leading-tight">
          <p className="text-sm text-slate-800">{getFullName(m.createdBy)}</p>
          {m.createdBy?.email && (
            <p className="text-xs text-slate-400">{m.createdBy.email}</p>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (m: any) =>
        m.createdAt
          ? new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
          : "—",
    },
    {
      header: "File",
      cell: (m: any) => (
        <div>
          {m.fileUrl ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewFile(m.fileUrl)}
              title="View or download file"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View File
            </Button>
          ) : (
            <span className="text-xs text-slate-400">No file</span>
          )}
        </div>
      ),
    },
    ...(canManage ? [{
      header: "Actions",
      cell: (m: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(m)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(m)}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Materials" description="Publish, organize, and review NSTP learning resources" />

      {user && user.role !== "STUDENT" && (
        <FormSection
          title="Upload Learning Material"
          description="Share modules, lectures, and activities with students"
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Title" required error={form.formState.errors.title?.message} className="md:col-span-2">
              <Input placeholder="e.g. NSTP Orientation Module 1" {...form.register("title")} />
            </FormField>

            <FormField label="Category" required>
              <Select {...form.register("category")}>
                <option value="MODULE">Module</option>
                <option value="LECTURE">Lecture</option>
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="ACTIVITY">Activity</option>
              </Select>
            </FormField>

            <FormField label="Attachment" hint="PDF, Word, PowerPoint, image, or MP4">
              <div
                className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    <FileText className="h-4 w-4 shrink-0 text-sky-500" />
                    <span className="flex-1 truncate text-slate-700">{selectedFile.name}</span>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-500"
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
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </FormField>

            <FormField label="Description" className="md:col-span-2">
              <Textarea placeholder="Add a brief description for students" {...form.register("description")} />
            </FormField>

            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}

            <div className="md:col-span-2">
              <Button type="submit" disabled={mutation.isPending || isUploading}>
                {isUploading ? "Uploading…" : mutation.isPending ? "Saving…" : "Save Material"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="Materials" description="Latest uploads and announcements">
        {materialsQuery.isError && <Alert variant="danger">Unable to load materials.</Alert>}
        {materialsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={4} />
        ) : rows.length === 0 ? (
          <EmptyState title="No materials yet" description="Upload a new learning resource to get started." />
        ) : (
          <ResponsiveTableCards
            data={rows}
            columns={columns}
            rowKey={(m) => m.id}
            renderTitle={(m) => m.title}
          />
        )}
      </SectionCard>

      <Drawer
        open={!!editingMaterial}
        onOpenChange={(open) => !open && setEditingMaterial(null)}
        title="Edit Learning Material"
      >
        <div className="p-4 space-y-4">
          <FormField label="Title" required>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. NSTP Orientation Module 1"
            />
          </FormField>

          <FormField label="Category" required>
            <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
              <option value="MODULE">Module</option>
              <option value="LECTURE">Lecture</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="ACTIVITY">Activity</option>
            </Select>
          </FormField>

          <FormField label="Attachment" hint="PDF, Word, PowerPoint, image, or MP4">
            <div
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50"
              onClick={() => editFileInputRef.current?.click()}
            >
              {editFile ? (
                <>
                  <FileText className="h-4 w-4 shrink-0 text-sky-500" />
                  <span className="flex-1 truncate text-slate-700">{editFile.name}</span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); setEditFile(null) }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : editFileUrl ? (
                <>
                  <FileText className="h-4 w-4 shrink-0 text-sky-500" />
                  <span className="flex-1 truncate text-slate-700">Current file attached</span>
                  <button
                    type="button"
                    className="text-sky-600 hover:text-sky-700 text-xs"
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
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4"
              onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add a brief description for students"
            />
          </FormField>

          {updateMutation.isError && (
            <Alert variant="danger">
              {(updateMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || isUploading || !editTitle}
            >
              {isUploading ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingMaterial(null)}
            >
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
