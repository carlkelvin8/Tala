import { useState } from "react"
import { Outlet } from "react-router-dom"
import { PremiumAppSidebar } from "./PremiumAppSidebar"
import { Topbar } from "./Topbar"
import { Drawer } from "../ui/drawer"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <PremiumAppSidebar className="sticky top-0 hidden h-screen lg:block" />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} title="Navigation">
        <PremiumAppSidebar onNavigate={() => setSidebarOpen(false)} className="border-none" />
      </Drawer>
    </div>
  )
}