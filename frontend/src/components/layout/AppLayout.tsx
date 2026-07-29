import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { PremiumAppSidebar } from "./PremiumAppSidebar"
import { Topbar } from "./Topbar"
import { Drawer } from "../ui/drawer"

const routeVariants = {
  initial: { opacity: 0, y: 20, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.99,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 0.6] as const },
  },
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <PremiumAppSidebar className="sticky top-0 hidden h-screen lg:block" />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-6 overflow-hidden">
            <AnimatePresence mode="wait" initial={true}>
              <motion.div
                key={location.pathname}
                variants={routeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} title="Navigation">
        <PremiumAppSidebar onNavigate={() => setSidebarOpen(false)} className="border-none" />
      </Drawer>
    </div>
  )
}