import { PremiumAppSidebar } from "../components/layout/PremiumAppSidebar"
import { ChartAreaInteractive } from "../components/chart-area-interactive"
import { DataTable } from "../components/data-table"
import { SectionCards } from "../components/section-cards"
import { SiteHeader } from "../components/site-header"
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar"

export default function DashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <PremiumAppSidebar variant="inset" />
      <SidebarInset className="bg-slate-50">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <SectionCards />
          <ChartAreaInteractive />
          <DataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
