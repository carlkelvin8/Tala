// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the auth service functions for business logic
import { changePassword, loginUser, registerUser, updateProfile as updateProfileData } from "../services/authService.js"
// Import JWT helpers for signing and verifying tokens
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js"
// Import the helper to retrieve the authenticated user from context
import { getAuthUser } from "../middlewares/auth.js"
// Import the user repository for direct user lookups
import { userRepository } from "../repositories/userRepository.js"
// Import the Prisma client for direct database queries
import { prisma } from "../lib/prisma.js"

/* POST /api/auth/register — create a new user account */
export async function register(c: Context) {
  try {
    // Parse the JSON request body containing registration fields
    const body = await c.req.json()
    // Delegate to the auth service to validate, hash password, and create the user
    const user = await registerUser(body)
    // Return a success response with the new user's ID, email, and role
    return c.json(ok("User registered", { id: user.id, email: user.email, role: user.role }))
  } catch (error) {
    // Return 400 with the error message if registration fails (e.g. duplicate email)
    return c.json(fail(error instanceof Error ? error.message : "Registration failed"), 400)
  }
}

/* POST /api/auth/login — authenticate a user and issue JWT tokens */
export async function login(c: Context) {
  try {
    // Parse the JSON request body containing email/studentNo and password
    const body = await c.req.json()
    // Delegate to the auth service to verify credentials and generate tokens
    const result = await loginUser(body.email, body.password)
    // Return a success response with the user object and both tokens
    return c.json(
      ok("Login successful", {
        user: { 
          id: result.user.id,                              // User's unique ID
          email: result.user.email,                        // User's email address
          role: result.user.role,                          // User's assigned role
          avatarUrl: result.user.avatarUrl ?? null,        // Avatar image URL or null if not set
          avatarFrame: result.user.avatarFrame ?? "gradient" // Avatar frame style, defaulting to "gradient"
        },
        accessToken: result.accessToken,   // Short-lived JWT for API authentication
        refreshToken: result.refreshToken  // Long-lived JWT for obtaining new access tokens
      })
    )
  } catch (error) {
    // Return 400 with the error message if login fails (e.g. invalid credentials)
    return c.json(fail(error instanceof Error ? error.message : "Login failed"), 400)
  }
}

/* POST /api/auth/refresh — exchange a refresh token for a new token pair */
export async function refresh(c: Context) {
  try {
    // Parse the JSON request body containing the refresh token
    const body = await c.req.json()
    // Verify the refresh token signature and expiry; throws if invalid
    const payload = verifyRefreshToken(body.refreshToken)
    // Look up the user by the subject claim (user ID) from the token
    const user = await userRepository.findById(payload.sub)
    // If the user no longer exists, reject the refresh attempt
    if (!user) {
      return c.json(fail("Invalid token"), 401)
    }
    // Issue a new access token with the user's current ID and role
    const accessToken = signAccessToken({ sub: user.id, role: user.role })
    // Issue a new refresh token (token rotation for security)
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role })
    // Return both new tokens to the client
    return c.json(ok("Token refreshed", { accessToken, refreshToken }))
  } catch {
    // Any verification error results in 401 Unauthorized
    return c.json(fail("Invalid token"), 401)
  }
}

/* GET /api/auth/profile — return the authenticated user's full profile */
export async function profile(c: Context) {
  // Retrieve the authenticated user from the Hono context (set by authMiddleware)
  const authUser = getAuthUser(c)
  // Fetch the full user record including all role-specific profile relations
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      studentProfile: true,       // Include student-specific profile fields if applicable
      implementorProfile: true,   // Include implementor-specific profile fields if applicable
      cadetOfficerProfile: true,  // Include cadet officer-specific profile fields if applicable
    },
  })
  // If the user was deleted after the token was issued, return 404
  if (!user) {
    return c.json(fail("User not found"), 404)
  }

  // Pick the first non-null role profile (only one will be set per user)
  const roleProfile =
    user.studentProfile ??
    user.implementorProfile ??
    user.cadetOfficerProfile ??
    null

  // Return the user's public profile data
  return c.json(
    ok("Profile fetched", {
      id: user.id,                              // User's unique ID
      email: user.email,                        // User's email address
      role: user.role,                          // User's assigned role
      isActive: user.isActive,                  // Whether the account is active
      avatarUrl: user.avatarUrl ?? null,        // Avatar image URL or null
      avatarFrame: user.avatarFrame ?? "gradient", // Avatar frame style
      createdAt: user.createdAt,                // Account creation timestamp
      profile: roleProfile
        ? {
            firstName: roleProfile.firstName,                                                          // First name from the role profile
            lastName: roleProfile.lastName,                                                            // Last name from the role profile
            contactNo: roleProfile.contactNo ?? null,                                                  // Contact number or null
            studentNo: "studentNo" in roleProfile ? roleProfile.studentNo ?? null : null,              // Student number (students only)
            middleName: "middleName" in roleProfile ? roleProfile.middleName ?? null : null,           // Middle name (students only)
            birthDate: "birthDate" in roleProfile ? roleProfile.birthDate ?? null : null,              // Birth date (students only)
            gender: "gender" in roleProfile ? roleProfile.gender ?? null : null,                       // Gender (students only)
            address: "address" in roleProfile ? roleProfile.address ?? null : null,                    // Address (students only)
          }
        : null, // Return null if no role profile exists
    })
  )
}

/* PATCH /api/auth/avatar — update the authenticated user's avatar image */
export async function updateAvatar(c: Context) {
  try {
    // Retrieve the authenticated user from context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the base64-encoded image data
    const body = await c.req.json()
    const { avatarUrl } = body
    // Validate that the value is a string and starts with the expected data URI prefix
    if (typeof avatarUrl !== "string" || !avatarUrl.startsWith("data:image/")) {
      return c.json(fail("Invalid image data"), 400)
    }
    // Reject images larger than ~300 KB to prevent database bloat
    if (avatarUrl.length > 300_000) {
      return c.json(fail("Image is too large. Please use a smaller photo."), 400)
    }
    // Persist the new avatar URL to the user record in the database
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl },
    })
    // Return the updated avatar URL in the response
    return c.json(ok("Avatar updated", { avatarUrl: updated.avatarUrl }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Avatar update failed"), 400)
  }
}

/* DELETE /api/auth/avatar — remove the authenticated user's avatar image */
export async function removeAvatar(c: Context) {
  try {
    // Retrieve the authenticated user from context
    const authUser = getAuthUser(c)
    // Set the avatarUrl field to null in the database to remove the avatar
    await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl: null },
    })
    // Return a success message with no data payload
    return c.json(ok("Avatar removed"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Avatar removal failed"), 400)
  }
}

/* PATCH /api/auth/avatar-frame — update the authenticated user's avatar frame style */
export async function updateAvatarFrame(c: Context) {
  try {
    // Retrieve the authenticated user from context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the desired frame style
    const body = await c.req.json()
    const { avatarFrame } = body
    
    // Define the list of valid frame style identifiers
    const validFrames = ["none", "gradient", "double", "glow", "hexagon", "badge"]
    // Reject the request if the provided frame is not in the allowed list
    if (typeof avatarFrame !== "string" || !validFrames.includes(avatarFrame)) {
      return c.json(fail("Invalid frame type"), 400)
    }
    
    // Persist the new frame style to the user record in the database
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarFrame },
    })
    // Return the updated frame style in the response
    return c.json(ok("Avatar frame updated", { avatarFrame: updated.avatarFrame }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Frame update failed"), 400)
  }
}

/* POST /api/auth/change-password — change the authenticated user's password */
export async function updatePassword(c: Context) {
  try {
    // Retrieve the authenticated user from context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the current and new passwords
    const body = await c.req.json()
    // Delegate to the auth service to verify the current password and hash the new one
    await changePassword(authUser.id, body.currentPassword, body.newPassword)
    // Return a success message with no data payload
    return c.json(ok("Password updated"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Password update failed"), 400)
  }
}

/* POST /api/auth/logout — stateless logout (client is responsible for discarding tokens) */
export async function logout(c: Context) {
  // No server-side state to clear — simply return a success message
  return c.json(ok("Logged out"))
}

/* PATCH /api/auth/profile — update the authenticated user's profile fields */
export async function updateProfile(c: Context) {
  try {
    // Retrieve the authenticated user from context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the profile fields to update
    const body = await c.req.json()
    // Delegate to the auth service to update the appropriate role-specific profile
    await updateProfileData(authUser.id, body)
    // Return a success message with no data payload
    return c.json(ok("Profile updated"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Profile update failed"), 400)
  }
}
