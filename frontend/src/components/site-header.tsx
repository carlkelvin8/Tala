import { SidebarTrigger } from "../components/ui/sidebar"
import { getStoredUser, getUserDisplayName, getUserInitials } from "../lib/auth"
import { Bell, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import * as React from "react"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/enrollment": "Enrollment Management",
  "/students": "Student Directory",
  "/sections": "Section Management",
  "/courses": "Course Management",
  "/flights": "Flight Management",
  "/materials": "Learning Materials",
  "/attendance": "Attendance Tracking",
  "/grades": "Grade Management",
  "/merits": "Merits & Demerits",
  "/exams": "Examination System",
  "/reports": "Reports & Analytics",
  "/users": "User Management",
  "/profile": "My Profile",
  "/training": "Training Monitoring",
  "/terms": "Academic Terms",
}

export function SiteHeader() {
  const user = getStoredUser()
  const [currentUser, setCurrentUser] = React.useState(user)
  const location = useLocation()
  const navigate = useNavigate()
  const displayName = currentUser ? getUserDisplayName(currentUser) : null
  const userInitials = currentUser ? getUserInitials(currentUser) : "G"

  React.useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(getStoredUser())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  
  const pageTitle = pageTitles[location.pathname] || "Command Overview"

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-silver/30 bg-white/95 backdrop-blur-sm px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 text-darksilver hover:text-black hover:bg-silver/20 rounded-lg p-2 transition-colors" />
        <div className="h-6 w-px bg-silver/30" />
        <div>
          <h1 className="text-base font-bold text-black">{pageTitle}</h1>
          {displayName && (
            <p className="text-xs text-darksilver mt-0.5">
              {greeting}, <span className="font-semibold text-black/80">{displayName}</span>
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-lg text-darksilver hover:text-black hover:bg-silver/20 transition-colors">
          <Search className="h-4 w-4" />
        </button>
        
        <button aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-darksilver hover:text-black hover:bg-silver/20 transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <button 
          onClick={() => navigate("/profile")}
          aria-label="Profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy via-royal to-royal text-white hover:shadow-md transition-all overflow-hidden border-2 border-silver/30 hover:border-silver/40"
        >
          {currentUser?.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              alt={displayName || "User"} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold">{userInitials}</span>
          )}
        </button>
      </div>
    </header>
  )
}
