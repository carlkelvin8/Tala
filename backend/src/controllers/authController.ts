
import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { changePassword, loginUser, registerUser, updateProfile as updateProfileData } from "../services/authService.js"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js"
import { getAuthUser } from "../middlewares/auth.js"
import { userRepository } from "../repositories/userRepository.js"
import { prisma } from "../lib/prisma.js"

export async function register(c: Context) {
  try {
    const body = await c.req.json()
    const user = await registerUser(body)
    return c.json(ok("User registered", { id: user.id, email: user.email, role: user.role }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Registration failed"), 400)
  }
}

export async function login(c: Context) {
  try {
    const body = await c.req.json()
    const result = await loginUser(body.email, body.password)
    return c.json(
      ok("Login successful", {
        user: { 
          id: result.user.id, 
          email: result.user.email, 
          role: result.user.role, 
          avatarUrl: result.user.avatarUrl ?? null,
          avatarFrame: result.user.avatarFrame ?? "gradient"
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      })
    )
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Login failed"), 400)
  }
}

export async function refresh(c: Context) {
  try {
    const body = await c.req.json()
    const payload = verifyRefreshToken(body.refreshToken)
    const user = await userRepository.findById(payload.sub)
    if (!user) {
      return c.json(fail("Invalid token"), 401)
    }
    const accessToken = signAccessToken({ sub: user.id, role: user.role })
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role })
    return c.json(ok("Token refreshed", { accessToken, refreshToken }))
  } catch {
    return c.json(fail("Invalid token"), 401)
  }
}

export async function profile(c: Context) {
  const authUser = getAuthUser(c)
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      studentProfile: true,
      implementorProfile: true,
      cadetOfficerProfile: true,
    },
  })
  if (!user) {
    return c.json(fail("User not found"), 404)
  }

  const roleProfile =
    user.studentProfile ??
    user.implementorProfile ??
    user.cadetOfficerProfile ??
    null

  return c.json(
    ok("Profile fetched", {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? null,
      avatarFrame: user.avatarFrame ?? "gradient",
      createdAt: user.createdAt,
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
}

export async function updateAvatar(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const { avatarUrl } = body
    if (typeof avatarUrl !== "string" || !avatarUrl.startsWith("data:image/")) {
      return c.json(fail("Invalid image data"), 400)
    }
    if (avatarUrl.length > 300_000) {
      return c.json(fail("Image is too large. Please use a smaller photo."), 400)
    }
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl },
    })
    return c.json(ok("Avatar updated", { avatarUrl: updated.avatarUrl }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Avatar update failed"), 400)
  }
}

export async function removeAvatar(c: Context) {
  try {
    const authUser = getAuthUser(c)
    await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl: null },
    })
    return c.json(ok("Avatar removed"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Avatar removal failed"), 400)
  }
}

export async function updateAvatarFrame(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const { avatarFrame } = body
    
    const validFrames = ["none", "gradient", "double", "glow", "hexagon", "badge"]
    if (typeof avatarFrame !== "string" || !validFrames.includes(avatarFrame)) {
      return c.json(fail("Invalid frame type"), 400)
    }
    
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarFrame },
    })
    return c.json(ok("Avatar frame updated", { avatarFrame: updated.avatarFrame }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Frame update failed"), 400)
  }
}

export async function updatePassword(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    await changePassword(authUser.id, body.currentPassword, body.newPassword)
    return c.json(ok("Password updated"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Password update failed"), 400)
  }
}

export async function logout(c: Context) {
  return c.json(ok("Logged out"))
}


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
