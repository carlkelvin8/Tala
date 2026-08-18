import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { changePassword, loginUser, registerUser, updateProfile as updateProfileData, forgotPassword as forgotPasswordService, resetPassword as resetPasswordService } from "../services/authService.js"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js"
import { getAuthUser } from "../middlewares/auth.js"
import { userRepository } from "../repositories/userRepository.js"
import { prisma } from "../lib/prisma.js"
import { validateAvatarDataUrl } from "../lib/imageData.js"

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
    const body = await c.req.json()
    const result = await loginUser(body.email, body.password)

    let sectionId: string | null = null
    if (result.user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: result.user.id },
        select: { sectionId: true }
      })
      sectionId = profile?.sectionId ?? null
    } else if (result.user.role === "CADET_OFFICER") {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: result.user.id, status: "APPROVED" },
        select: { sectionId: true },
        orderBy: { createdAt: "desc" }
      })
      sectionId = enrollment?.sectionId ?? null
    }

    return c.json(
      ok("Login successful", {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          avatarUrl: result.user.avatarUrl ?? null,
          avatarFrame: result.user.avatarFrame ?? "gradient",
          sectionId
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      })
    )
  } catch (error) {
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
    if (!user || !user.isActive || user.refreshTokenVersion !== payload.tokenVersion) {
      return c.json(fail("Invalid token"), 401)
    }
    const rotated = await prisma.user.updateMany({
      where: { id: user.id, refreshTokenVersion: payload.tokenVersion },
      data: { refreshTokenVersion: { increment: 1 } }
    })
    if (rotated.count !== 1) {
      return c.json(fail("Invalid token"), 401)
    }
    // Issue a new access token with the user's current ID and role
    const accessToken = signAccessToken({ sub: user.id, role: user.role })
    // Issue a new refresh token (token rotation for security)
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, tokenVersion: payload.tokenVersion + 1 })
    // Return both new tokens to the client
    return c.json(ok("Token refreshed", { accessToken, refreshToken }))
  } catch {
    // Any verification error results in 401 Unauthorized
    return c.json(fail("Invalid token"), 401)
  }
}

/* GET /api/auth/profile — return the authenticated user's full profile */
export async function profile(c: Context) {
  try {
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
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl ?? null,
        avatarFrame: user.avatarFrame ?? "gradient",
        createdAt: user.createdAt,
        passwordUpdatedAt: user.passwordUpdatedAt,
        profile: roleProfile
          ? {
              firstName: roleProfile.firstName,
              lastName: roleProfile.lastName,
              contactNo: roleProfile.contactNo ?? null,
              studentNo: "studentNo" in roleProfile ? roleProfile.studentNo ?? null : null,
              middleName: "middleName" in roleProfile ? roleProfile.middleName ?? null : null,
              birthDate: "birthDate" in roleProfile ? roleProfile.birthDate ?? null : null,
              gender: "gender" in roleProfile ? roleProfile.gender ?? null : null,
              address: "address" in roleProfile ? roleProfile.address ?? null : null,
            }
          : null,
      })
    )
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch profile"), 500)
  }
}

/* PATCH /api/auth/avatar — update the authenticated user's avatar image */
export async function updateAvatar(c: Context) {
  try {
    // Retrieve the authenticated user from context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the base64-encoded image data
    const body = await c.req.json()
    const avatarUrl = validateAvatarDataUrl(body.avatarUrl)
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

/* POST /api/auth/logout — revoke every refresh token issued for this user. */
export async function logout(c: Context) {
  try {
    const authUser = getAuthUser(c)
    await prisma.user.update({
      where: { id: authUser.id },
      data: { refreshTokenVersion: { increment: 1 } }
    })
    return c.json(ok("Logged out"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Logout failed"), 500)
  }
}

/* PATCH /api/auth/profile — update the authenticated user's profile fields */
export async function updateProfile(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    await updateProfileData(authUser.id, body)
    return c.json(ok("Profile updated"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Profile update failed"), 400)
  }
}

/* POST /api/auth/forgot-password — generate a password reset token */
export async function forgotPassword(c: Context) {
  try {
    const body = await c.req.json()
    const result = await forgotPasswordService(body.email)
    return c.json(ok("Password reset token generated", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to generate reset token"), 400)
  }
}

/* POST /api/auth/reset-password — reset password using token */
export async function resetPassword(c: Context) {
  try {
    const body = await c.req.json()
    await resetPasswordService(body.token, body.newPassword)
    return c.json(ok("Password reset successfully"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Password reset failed"), 400)
  }
}
