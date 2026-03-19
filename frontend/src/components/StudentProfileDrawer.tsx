import { useQuery } from "@tanstack/react-query" // Import useQuery for fetching the user's profile data
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Drawer } from "./ui/drawer" // Import the Drawer component for the slide-in panel
import { Avatar } from "./ui/avatar" // Import the Avatar component for the profile photo placeholder
import { Badge } from "./ui/badge" // Import the Badge component for status and role badges
import { Alert } from "./ui/alert" // Import the Alert component for error messages
import { LoadingSkeleton } from "./ui/loading-skeleton" // Import the loading skeleton for the loading state
import { Mail, Phone, MapPin, Calendar, User, Hash, Users, Plane } from "lucide-react" // Import icons for the profile detail rows
import { getApiFileUrl } from "../lib/display" // Import the utility to convert relative file paths to absolute URLs

// Props type for the StudentProfileDrawer component
interface StudentProfileDrawerProps {
  userId: string | null // The ID of the user to display; null means the drawer is closed
  onClose: () => void // Callback to close the drawer (called when the drawer is dismissed)
}

// Slide-in drawer component that displays a user's full profile details
export function StudentProfileDrawer({ userId, onClose }: StudentProfileDrawerProps) {
  const profileQuery = useQuery({ // Fetch the user's profile data when a userId is provided
    queryKey: ["user-profile", userId], // Cache key includes the userId so different users are cached separately
    queryFn: () => apiRequest<ApiResponse<any>>(`/api/users/${userId}`), // Fetch the user by their ID
    enabled: !!userId, // Only run the query when a userId is provided (not null)
    retry: false // Don't retry on failure (e.g. 404 or 401)
  })

  const user = profileQuery.data?.data // Extract the user object from the API response
  const profile = user?.studentProfile || user?.implementorProfile || user?.cadetOfficerProfile // Pick the first non-null profile (student, implementor, or cadet officer)

  return (
    <Drawer open={!!userId} onOpenChange={(open) => !open && onClose()} title="Student Profile"> {/* Open when userId is set; call onClose when dismissed */}
      <div className="p-4"> {/* Drawer content with padding */}
        {profileQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={8} columns={1} /> // Skeleton with 8 rows for the profile fields
        ) : profileQuery.isError ? ( // Show error alert if the fetch failed
          <Alert variant="danger">
            {(profileQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to view profiles." // Specific message for auth errors
              : "Unable to load profile. Please try again."} {/* Generic error message */}
          </Alert>
        ) : user ? ( // Only render the profile content if user data is available
          <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
          {/* Profile Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200"> {/* Header row with avatar and basic info, bottom border */}
            {user.avatarUrl ? ( // Show the uploaded avatar if available
              <img
                src={getApiFileUrl(user.avatarUrl) || undefined} // Convert the relative path to an absolute URL
                alt={profile ? `${profile.firstName} ${profile.lastName}` : user.email} // Alt text using the user's name or email
                className="h-16 w-16 rounded-full object-cover" // Circular avatar image
              />
            ) : (
              <Avatar className="h-16 w-16 text-lg"> {/* Fallback avatar with initials */}
                {profile
                  ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() // First letter of first and last name
                  : user.email.substring(0, 2).toUpperCase()} {/* First two letters of email as fallback */}
              </Avatar>
            )}
            <div className="flex-1"> {/* Text block next to the avatar */}
              <h3 className="text-lg font-semibold text-slate-900"> {/* User's full name or email */}
                {profile ? `${profile.firstName} ${profile.lastName}` : user.email}
              </h3>
              <p className="text-sm text-slate-500">{user.email}</p> {/* User's email address */}
              <div className="mt-2"> {/* Badge row */}
                <Badge variant={user.isActive ? "success" : "default"}> {/* Green badge for active, gray for inactive */}
                  {user.isActive ? "Active" : "Inactive"} {/* Active/inactive status text */}
                </Badge>
                <Badge variant="default" className="ml-2"> {/* Role badge with left margin */}
                  {user.role} {/* User's role string */}
                </Badge>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4"> {/* Vertical stack of profile detail rows */}
            <div className="flex items-start gap-3"> {/* Email row */}
              <Mail className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Mail icon, aligned to top */}
              <div>
                <p className="text-xs text-slate-500">Email</p> {/* Field label */}
                <p className="text-sm text-slate-900 break-all">{user.email}</p> {/* Email value, break-all to handle long emails */}
              </div>
            </div>

            {profile?.studentNo && ( // Only show student number if available
              <div className="flex items-start gap-3"> {/* Student number row */}
                <Hash className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Hash icon */}
                <div>
                  <p className="text-xs text-slate-500">Student Number</p> {/* Field label */}
                  <p className="text-sm text-slate-900">{profile.studentNo}</p> {/* Student number value */}
                </div>
              </div>
            )}

            {profile?.contactNo && ( // Only show contact number if available
              <div className="flex items-start gap-3"> {/* Contact number row */}
                <Phone className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Phone icon */}
                <div>
                  <p className="text-xs text-slate-500">Contact Number</p> {/* Field label */}
                  <p className="text-sm text-slate-900">{profile.contactNo}</p> {/* Contact number value */}
                </div>
              </div>
            )}

            {profile?.birthDate && ( // Only show birth date if available
              <div className="flex items-start gap-3"> {/* Birth date row */}
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Calendar icon */}
                <div>
                  <p className="text-xs text-slate-500">Birth Date</p> {/* Field label */}
                  <p className="text-sm text-slate-900">
                    {new Date(profile.birthDate).toLocaleDateString(undefined, { // Format the birth date
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>
            )}

            {profile?.gender && ( // Only show gender if available
              <div className="flex items-start gap-3"> {/* Gender row */}
                <User className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* User icon */}
                <div>
                  <p className="text-xs text-slate-500">Gender</p> {/* Field label */}
                  <p className="text-sm text-slate-900">{profile.gender}</p> {/* Gender value */}
                </div>
              </div>
            )}

            {profile?.address && ( // Only show address if available
              <div className="flex items-start gap-3"> {/* Address row */}
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Map pin icon */}
                <div>
                  <p className="text-xs text-slate-500">Address</p> {/* Field label */}
                  <p className="text-sm text-slate-900">{profile.address}</p> {/* Address value */}
                </div>
              </div>
            )}

            {profile?.section && ( // Only show section if the student is assigned to one
              <div className="flex items-start gap-3"> {/* Section row */}
                <Users className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Users icon */}
                <div>
                  <p className="text-xs text-slate-500">Section</p> {/* Field label */}
                  <p className="text-sm text-slate-900">
                    {profile.section.code} - {profile.section.name} {/* Section code and name */}
                  </p>
                </div>
              </div>
            )}

            {profile?.flight && ( // Only show flight if the student is assigned to one
              <div className="flex items-start gap-3"> {/* Flight row */}
                <Plane className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" /> {/* Plane icon */}
                <div>
                  <p className="text-xs text-slate-500">Flight</p> {/* Field label */}
                  <p className="text-sm text-slate-900">
                    {profile.flight.code} - {profile.flight.name} {/* Flight code and name */}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="pt-6 border-t border-gray-200"> {/* Account info section with top border */}
            <h4 className="text-sm font-medium text-slate-700 mb-3">Account Information</h4> {/* Section title */}
            <div className="space-y-2 text-xs text-slate-500"> {/* Vertical stack of account timestamps */}
              <p>
                Created: {new Date(user.createdAt).toLocaleDateString(undefined, { // Format the account creation date
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
              <p>
                Last Updated: {new Date(user.updatedAt).toLocaleDateString(undefined, { // Format the last update date
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
          </div>
        </div>
      ) : null} {/* Render nothing if user data is not available */}
      </div>
    </Drawer>
  )
}
