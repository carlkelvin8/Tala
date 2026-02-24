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
  "/flights": "Flight Management",
  "/materials": "Learning Materials",
  "/attendance": "Attendance Tracking",
  "/grades": "Grade Management",
  "/merits": "Merits & Demerits",
  "/exams": "Examination System",
  "/reports": "Reports & Analytics",
  "/users": "User Management",
  "/profile": "My Profile",
}

export function SiteHeader() {
  const user = getStoredUser()
  const [currentUser, setCurrentUser] = React.useState(user)
  const location = useLocation()
  const navigate = useNavigate()
  const displayName = currentUser ? getUserDisplayName(currentUser) : null
  const userInitials = currentUser ? getUserInitials(currentUser) : "G"

  // Update user data when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(getStoredUser())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for updates
    const interval = setInterval(() => {
      setCurrentUser(getStoredUser())
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  
  const pageTitle = pageTitles[location.pathname] || "Command Overview"

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2 transition-colors" />
        <div className="h-6 w-px bg-slate-200" />
        <div>
          <h1 className="text-base font-bold text-slate-900">{pageTitle}</h1>
          {displayName && (
            <p className="text-xs text-slate-500 mt-0.5">
              {greeting}, <span className="font-semibold text-slate-700">{displayName}</span>
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search Button */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Search className="h-4 w-4" />
        </button>
        
        {/* Notifications Button */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* Profile Picture */}
        <button 
          onClick={() => navigate("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white hover:shadow-md transition-all overflow-hidden border-2 border-slate-200 hover:border-slate-300"
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
