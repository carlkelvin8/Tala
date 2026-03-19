import { PremiumAppSidebar } from "../components/layout/PremiumAppSidebar" // Import the premium sidebar component used specifically on the dashboard
import { ChartAreaInteractive } from "../components/chart-area-interactive" // Import the interactive area chart component for data visualization
import { DataTable } from "../components/data-table" // Import the data table component for tabular data display
import { SectionCards } from "../components/section-cards" // Import the section cards component for summary stat cards
import { SiteHeader } from "../components/site-header" // Import the site header component for the dashboard topbar
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar" // Import SidebarInset (the main content area next to the sidebar) and SidebarProvider (context provider for sidebar state)

// The main dashboard page component — uses its own layout with PremiumAppSidebar
export default function DashboardPage() {
  return (
    <SidebarProvider
      style={ // Inject CSS custom properties to control sidebar and header dimensions
        {
          "--sidebar-width": "calc(var(--spacing) * 72)", // Set the sidebar width to 72 spacing units using the CSS spacing variable
          "--header-height": "calc(var(--spacing) * 14)", // Set the header height to 14 spacing units using the CSS spacing variable
        } as React.CSSProperties // Cast to React.CSSProperties to allow CSS custom properties in the style prop
      }
    >
      <PremiumAppSidebar variant="inset" /> {/* Render the premium sidebar with the "inset" variant (sidebar is inset within the layout) */}
      <SidebarInset className="bg-slate-50"> {/* The main content area next to the sidebar, with a light gray background */}
        <SiteHeader /> {/* Render the dashboard-specific site header/topbar */}
        <div className="flex flex-1 flex-col gap-6 p-6"> {/* Flex column container that fills remaining space, with gap between sections and padding */}
          <SectionCards /> {/* Render the summary stat cards (e.g. total students, attendance rate) */}
          <ChartAreaInteractive /> {/* Render the interactive area chart for trend visualization */}
          <DataTable /> {/* Render the data table for detailed records */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
