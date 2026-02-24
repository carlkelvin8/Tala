import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Drawer } from "./ui/drawer"
import { Avatar } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Alert } from "./ui/alert"
import { LoadingSkeleton } from "./ui/loading-skeleton"
import { Mail, Phone, MapPin, Calendar, User, Hash, Users, Plane } from "lucide-react"
import { getApiFileUrl } from "../lib/display"

interface StudentProfileDrawerProps {
  userId: string | null
  onClose: () => void
}

export function StudentProfileDrawer({ userId, onClose }: StudentProfileDrawerProps) {
  const profileQuery = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => apiRequest<ApiResponse<any>>(`/api/users/${userId}`),
    enabled: !!userId,
    retry: false
  })

  const user = profileQuery.data?.data
  const profile = user?.studentProfile || user?.implementorProfile || user?.cadetOfficerProfile

  return (
    <Drawer open={!!userId} onOpenChange={(open) => !open && onClose()} title="Student Profile">
      <div className="p-4">
        {profileQuery.isLoading ? (
          <LoadingSkeleton rows={8} columns={1} />
        ) : profileQuery.isError ? (
          <Alert variant="danger">
            {(profileQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to view profiles."
              : "Unable to load profile. Please try again."}
          </Alert>
        ) : user ? (
          <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            {user.avatarUrl ? (
              <img
                src={getApiFileUrl(user.avatarUrl) || undefined}
                alt={profile ? `${profile.firstName} ${profile.lastName}` : user.email}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <Avatar className="h-16 w-16 text-lg">
                {profile
                  ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
                  : user.email.substring(0, 2).toUpperCase()}
              </Avatar>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {profile ? `${profile.firstName} ${profile.lastName}` : user.email}
              </h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-2">
                <Badge variant={user.isActive ? "success" : "default"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="default" className="ml-2">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-slate-900 break-all">{user.email}</p>
              </div>
            </div>

            {profile?.studentNo && (
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Student Number</p>
                  <p className="text-sm text-slate-900">{profile.studentNo}</p>
                </div>
              </div>
            )}

            {profile?.contactNo && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Contact Number</p>
                  <p className="text-sm text-slate-900">{profile.contactNo}</p>
                </div>
              </div>
            )}

            {profile?.birthDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Birth Date</p>
                  <p className="text-sm text-slate-900">
                    {new Date(profile.birthDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>
            )}

            {profile?.gender && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Gender</p>
                  <p className="text-sm text-slate-900">{profile.gender}</p>
                </div>
              </div>
            )}

            {profile?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm text-slate-900">{profile.address}</p>
                </div>
              </div>
            )}

            {profile?.section && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Section</p>
                  <p className="text-sm text-slate-900">
                    {profile.section.code} - {profile.section.name}
                  </p>
                </div>
              </div>
            )}

            {profile?.flight && (
              <div className="flex items-start gap-3">
                <Plane className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Flight</p>
                  <p className="text-sm text-slate-900">
                    {profile.flight.code} - {profile.flight.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Account Information</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <p>
                Created: {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
              <p>
                Last Updated: {new Date(user.updatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </Drawer>
  )
}
