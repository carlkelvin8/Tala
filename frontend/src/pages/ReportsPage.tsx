import { Button } from "../components/ui/button" // Import the reusable Button component
import { Input } from "../components/ui/input" // Import the reusable Input component for date fields
import { useState } from "react" // Import useState for managing the date filter and download state
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component for the page title
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { FormSection } from "../components/ui/form-section" // Import the FormSection wrapper for the report form
import { getAccessToken } from "../lib/auth" // Import the function to get the JWT token for authenticated downloads
import { toast } from "sonner" // Import toast for showing success/error/warning notifications

const baseUrl = import.meta.env.VITE_API_URL ?? "" // Read the API base URL from the Vite environment variable

// The reports page component for generating and downloading CSV reports
export function ReportsPage() {
  const [from, setFrom] = useState("") // State for the "from" date filter, starts empty (no filter)
  const [to, setTo] = useState("") // State for the "to" date filter, starts empty (no filter)
  const [isDownloading, setIsDownloading] = useState(false) // State to track whether a download is in progress

  const downloadEnrollmentCsv = async () => { // Async handler for the download button
    setIsDownloading(true) // Set downloading state to disable the button and show loading text
    try {
      const params = new URLSearchParams() // Create a URLSearchParams object to build the query string
      if (from) params.set("from", from) // Add the "from" date parameter if it's set
      if (to) params.set("to", to) // Add the "to" date parameter if it's set
      
      const token = getAccessToken() // Get the JWT access token for the Authorization header
      const url = `${baseUrl}/api/reports/enrollments.csv${params.toString() ? `?${params.toString()}` : ""}` // Build the full download URL with optional query parameters
      
      const response = await fetch(url, { // Make the authenticated fetch request for the CSV file
        headers: token ? { Authorization: `Bearer ${token}` } : {} // Include the Bearer token if available
      })
      
      if (!response.ok) { // If the server returned an error status
        const text = await response.text() // Read the error response body as text
        throw new Error(text || "Failed to generate report") // Throw an error with the server's message
      }
      
      const blob = await response.blob() // Read the response body as a Blob (binary data for the CSV file)
      
      // Check if blob is empty or very small (just headers)
      if (blob.size < 50) { // If the blob is smaller than 50 bytes, it likely only contains CSV headers with no data
        toast.warning("No enrollment data found for the selected date range") // Warn the user that no data was found
      }
      
      const downloadUrl = window.URL.createObjectURL(blob) // Create a temporary object URL for the blob
      const a = document.createElement("a") // Create a temporary anchor element for triggering the download
      a.href = downloadUrl // Set the anchor's href to the blob URL
      a.download = `enrollments-${new Date().toISOString().split("T")[0]}.csv` // Set the download filename with today's date
      document.body.appendChild(a) // Append the anchor to the DOM (required for Firefox)
      a.click() // Programmatically click the anchor to trigger the browser's download dialog
      window.URL.revokeObjectURL(downloadUrl) // Release the temporary object URL to free memory
      document.body.removeChild(a) // Remove the temporary anchor from the DOM
      
      if (blob.size >= 50) { // Only show success if the file has actual data
        toast.success("Report downloaded successfully") // Show success notification
      }
    } catch (error) {
      console.error("Download error:", error) // Log the error to the console for debugging
      toast.error(error instanceof Error ? error.message : "Failed to download report") // Show error notification
    } finally {
      setIsDownloading(false) // Always reset the downloading state when done
    }
  }

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader title="Reports" description="Generate enrollment summaries and export CSVs" /> {/* Page title and description */}
      <FormSection title="Enrollment Report" description="Filter by date range before exporting (leave empty for all enrollments)"> {/* Form section with title and description */}
        <div className="grid gap-4 md:grid-cols-2"> {/* Two-column grid for the date range inputs */}
          <FormField label="From" hint="Optional: Start date"> {/* From date field with optional hint */}
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /> {/* Date input that updates the from state */}
          </FormField>
          <FormField label="To" hint="Optional: End date"> {/* To date field with optional hint */}
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /> {/* Date input that updates the to state */}
          </FormField>
        </div>
        <div className="flex items-center gap-4"> {/* Row of action buttons */}
          <Button onClick={downloadEnrollmentCsv} disabled={isDownloading}> {/* Download button, disabled while downloading */}
            {isDownloading ? "Downloading..." : "Download Enrollment CSV"} {/* Show loading text while downloading */}
          </Button>
          {(from || to) && ( // Only show the clear button if at least one date filter is set
            <Button 
              variant="outline" // Outline style for the secondary action
              onClick={() => { // Clear both date filters on click
                setFrom("") // Reset the from date
                setTo("") // Reset the to date
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
