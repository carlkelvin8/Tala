import { RoleType } from "../types" // Import the RoleType union to type the roles array on each nav item

// Type definition for a single navigation item in the sidebar
export type NavItem = {
  label: string // Human-readable label displayed in the sidebar link
  path: string // URL path that the link navigates to
  roles: RoleType[] // Array of roles that are allowed to see and access this nav item
}

// The master list of all navigation items, each with its label, path, and allowed roles
export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }, // Dashboard is accessible to all roles
  { label: "Enrollment", path: "/enrollment", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] }, // Enrollment management is hidden from students
  { label: "Students", path: "/students", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] }, // Student directory is hidden from students
  { label: "Sections", path: "/sections", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] }, // Section management is hidden from students
  { label: "Flights", path: "/flights", roles: ["ADMIN", "CADET_OFFICER"] }, // Flight management is only for admins and cadet officers
  { label: "Learning Materials", path: "/materials", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }, // Materials are accessible to all roles
  { label: "Attendance", path: "/attendance", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }, // Attendance is accessible to all roles
  { label: "Grades", path: "/grades", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }, // Grades are accessible to all roles
  { label: "Merits/Demerits", path: "/merits", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }, // Merits/demerits are accessible to all roles
  { label: "Exams", path: "/exams", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] }, // Exams are accessible to all roles
  { label: "Reports", path: "/reports", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] }, // Reports are hidden from students
  { label: "User Management", path: "/users", roles: ["ADMIN"] }, // User management is restricted to admins only
  { label: "Profile", path: "/profile", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] } // Profile page is accessible to all roles
]
