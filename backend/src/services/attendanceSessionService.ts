import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"
import {
  calculateDistance,
  isValidCoordinates,
  isWithinRadius,
  isSpeedRealistic,
  isTimestampFresh,
  type Coordinates,
} from "../lib/geolocation.js"
import { AttendanceStatus } from "@prisma/client"

interface LocationVerificationResult {
  allowed: boolean;
  reason?: string;
  distanceFromHost?: number;
  distanceFromVerifier?: number;
  requiredRadius?: number;
}

/**
 * Create a new attendance session (Admin/Teacher)
 */
export async function createSession(data: {
  title: string;
  date: Date;
  hostId: string;
  hostLatitude?: number;
  hostLongitude?: number;
  radiusMeters?: number;
  requireVerifier?: boolean;
  sectionId?: string;
  flightId?: string;
}) {
  // Validate host coordinates if provided
  if (data.hostLatitude !== undefined && data.hostLongitude !== undefined) {
    if (!isValidCoordinates({ latitude: data.hostLatitude, longitude: data.hostLongitude })) {
      throw new Error("Invalid host coordinates");
    }
  }

  const session = await prisma.attendanceSession.create({
    data: {
      title: data.title,
      date: data.date,
      startTime: new Date(),
      hostId: data.hostId,
      hostLatitude: data.hostLatitude,
      hostLongitude: data.hostLongitude,
      radiusMeters: data.radiusMeters ?? 50,
      requireVerifier: data.requireVerifier ?? false,
      sectionId: data.sectionId,
      flightId: data.flightId,
      isActive: true,
    },
  });

  await logAudit("CREATE", "AttendanceSession", session.id, data.hostId);
  return session;
}

/**
 * Update host location (Admin/Teacher updates their location)
 */
export async function updateHostLocation(
  sessionId: string,
  hostId: string,
  latitude: number,
  longitude: number
) {
  if (!isValidCoordinates({ latitude, longitude })) {
    throw new Error("Invalid coordinates");
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.hostId !== hostId) {
    throw new Error("Only the host can update host location");
  }

  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      hostLatitude: latitude,
      hostLongitude: longitude,
    },
  });

  await logAudit("UPDATE", "AttendanceSession", sessionId, hostId);
  return updated;
}

/**
 * Set verifier for session and update their location
 */
export async function setVerifier(
  sessionId: string,
  verifierId: string,
  latitude: number,
  longitude: number
) {
  if (!isValidCoordinates({ latitude, longitude })) {
    throw new Error("Invalid coordinates");
  }

  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      verifierId,
      verifierLatitude: latitude,
      verifierLongitude: longitude,
    },
  });

  await logAudit("UPDATE", "AttendanceSession", sessionId, verifierId);
  return updated;
}

/**
 * Update verifier location
 */
export async function updateVerifierLocation(
  sessionId: string,
  verifierId: string,
  latitude: number,
  longitude: number
) {
  if (!isValidCoordinates({ latitude, longitude })) {
    throw new Error("Invalid coordinates");
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.verifierId !== verifierId) {
    throw new Error("Only the assigned verifier can update verifier location");
  }

  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      verifierLatitude: latitude,
      verifierLongitude: longitude,
    },
  });

  await logAudit("UPDATE", "AttendanceSession", sessionId, verifierId);
  return updated;
}

/**
 * Verify if student location is valid for marking attendance
 */
export async function verifyStudentLocation(
  sessionId: string,
  studentCoord: Coordinates
): Promise<LocationVerificationResult> {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return { allowed: false, reason: "Session not found" };
  }

  if (!session.isActive) {
    return { allowed: false, reason: "Session is not active" };
  }

  // Validate student coordinates
  if (!isValidCoordinates(studentCoord)) {
    return { allowed: false, reason: "Invalid student coordinates" };
  }

  // Check if host location is set
  if (session.hostLatitude === null || session.hostLongitude === null) {
    return {
      allowed: false,
      reason: "Host location not set. Please ask the teacher to enable location.",
    };
  }

  const hostCoord: Coordinates = {
    latitude: session.hostLatitude,
    longitude: session.hostLongitude,
  };

  // Check distance from host
  const hostCheck = isWithinRadius(studentCoord, hostCoord, session.radiusMeters);

  if (!hostCheck.isWithin) {
    return {
      allowed: false,
      reason: `You are ${hostCheck.distance}m away from the teacher. Required: within ${session.radiusMeters}m`,
      distanceFromHost: hostCheck.distance,
      requiredRadius: session.radiusMeters,
    };
  }

  // If verifier is required, check verifier location
  if (session.requireVerifier) {
    if (!session.verifierId) {
      return {
        allowed: false,
        reason: "Verifier is required but not assigned for this session",
      };
    }

    if (session.verifierLatitude === null || session.verifierLongitude === null) {
      return {
        allowed: false,
        reason: "Verifier location not set. Please ask the verifier to enable location.",
      };
    }

    const verifierCoord: Coordinates = {
      latitude: session.verifierLatitude,
      longitude: session.verifierLongitude,
    };

    const verifierCheck = isWithinRadius(studentCoord, verifierCoord, session.radiusMeters);

    if (!verifierCheck.isWithin) {
      return {
        allowed: false,
        reason: `You are ${verifierCheck.distance}m away from the verifier. Required: within ${session.radiusMeters}m`,
        distanceFromHost: hostCheck.distance,
        distanceFromVerifier: verifierCheck.distance,
        requiredRadius: session.radiusMeters,
      };
    }
  }

  // All checks passed
  return {
    allowed: true,
    distanceFromHost: hostCheck.distance,
    distanceFromVerifier: session.requireVerifier ? isWithinRadius(studentCoord, {
      latitude: session.verifierLatitude!,
      longitude: session.verifierLongitude!,
    }, session.radiusMeters).distance : undefined,
    requiredRadius: session.radiusMeters,
  };
}

/**
 * Mark student attendance with location verification
 */
export async function markAttendanceWithLocation(
  sessionId: string,
  userId: string,
  latitude: number,
  longitude: number,
  timestamp: Date
) {
  // Anti-tamper: Check if timestamp is fresh
  if (!isTimestampFresh(timestamp, 60)) {
    throw new Error("Location timestamp is too old. Please refresh and try again.");
  }

  const studentCoord: Coordinates = { latitude, longitude };

  // Verify location
  const verification = await verifyStudentLocation(sessionId, studentCoord);

  if (!verification.allowed) {
    throw new Error(verification.reason || "Location verification failed");
  }

  // Get session date
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  // Check for previous attendance (anti-tamper: impossible speed)
  const previousRecord = await prisma.attendanceRecord.findFirst({
    where: {
      userId,
      checkInAt: { not: null },
    },
    orderBy: { checkInAt: "desc" },
  });

  if (previousRecord && previousRecord.latitude && previousRecord.longitude && previousRecord.checkInAt) {
    const timeDiff = (timestamp.getTime() - previousRecord.checkInAt.getTime()) / 1000;
    if (timeDiff > 0 && timeDiff < 3600) { // Check if within last hour
      const prevCoord: Coordinates = {
        latitude: previousRecord.latitude,
        longitude: previousRecord.longitude,
      };
      if (!isSpeedRealistic(prevCoord, studentCoord, timeDiff)) {
        throw new Error("Impossible travel speed detected. Please contact administrator.");
      }
    }
  }

  // Create attendance record
  const record = await prisma.attendanceRecord.create({
    data: {
      userId,
      date: session.date,
      checkInAt: timestamp,
      latitude,
      longitude,
      status: AttendanceStatus.PRESENT,
      sessionId,
      verifiedBy: session.verifierId || undefined,
    },
  });

  await logAudit("CREATE", "AttendanceRecord", record.id, userId);
  return record;
}

/**
 * Get active sessions
 */
export async function getActiveSessions(filters?: {
  sectionId?: string;
  flightId?: string;
}) {
  const where: Record<string, unknown> = { isActive: true };
  if (filters?.sectionId) where.sectionId = filters.sectionId;
  if (filters?.flightId) where.flightId = filters.flightId;

  return prisma.attendanceSession.findMany({
    where,
    include: {
      host: {
        select: {
          id: true,
          email: true,
          implementorProfile: { select: { firstName: true, lastName: true } },
          cadetOfficerProfile: { select: { firstName: true, lastName: true } },
        },
      },
      verifier: {
        select: {
          id: true,
          email: true,
          implementorProfile: { select: { firstName: true, lastName: true } },
          cadetOfficerProfile: { select: { firstName: true, lastName: true } },
        },
      },
      section: true,
      flight: true,
    },
    orderBy: { startTime: "desc" },
  });
}

/**
 * End attendance session
 */
export async function endSession(sessionId: string, hostId: string) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.hostId !== hostId) {
    throw new Error("Only the host can end the session");
  }

  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endTime: new Date(),
    },
  });

  await logAudit("UPDATE", "AttendanceSession", sessionId, hostId);
  return updated;
}
