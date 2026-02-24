import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useState } from "react"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { FormSection } from "../components/ui/form-section"
import { getAccessToken } from "../lib/auth"
import { toast } from "sonner"

const baseUrl = import.meta.env.VITE_API_URL ?? ""

export function ReportsPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadEnrollmentCsv = async () => {
    setIsDownloading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      
      const token = getAccessToken()
      const url = `${baseUrl}/api/reports/enrollments.csv${params.toString() ? `?${params.toString()}` : ""}`
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to generate report")
      }
      
      const blob = await response.blob()
      
      // Check if blob is empty or very small (just headers)
      if (blob.size < 50) {
        toast.warning("No enrollment data found for the selected date range")
      }
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `enrollments-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      
      if (blob.size >= 50) {
        toast.success("Report downloaded successfully")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to download report")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate enrollment summaries and export CSVs" />
      <FormSection title="Enrollment Report" description="Filter by date range before exporting (leave empty for all enrollments)">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="From" hint="Optional: Start date">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </FormField>
          <FormField label="To" hint="Optional: End date">
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </FormField>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={downloadEnrollmentCsv} disabled={isDownloading}>
            {isDownloading ? "Downloading..." : "Download Enrollment CSV"}
          </Button>
          {(from || to) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setFrom("")
                setTo("")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </FormSection>
    </div>
  )
}
