// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record session events
import { logAudit } from "./auditService.js"
// Import the absence check service to auto-fail students who exceed absence limits
import { checkAndMarkAbsences } from "./absenceService.js"
// Import geolocation utility functions for distance calculation and validation
import {
  calculateDistance,    // Calculates straight-line distance between two GPS points
  isValidCoordinates,   // Validates that coordinates are within legal lat/lon ranges
  isWithinRadius,       // Checks if a point is within a given radius of a reference point
  isSpeedRealistic,     // Anti-tamper: checks if movement speed is physically possible
  isTimestampFresh,     // Anti-tamper: checks if a timestamp is recent enough to be trusted
  type Coordinates,     // TypeScript interface for a lat/lon pair
} from "../lib/geolocation.js"
// Import the AttendanceStatus enum from Prisma for type-safe status values
import { AttendanceStatus } from "@prisma/client"

/* Shape of the result returned by the location verification function */
interface LocationVerificationResult {
  allowed: boolean;              // Whether the student's location passes all checks
  reason?: string;               // Human-readable explanation if not allowed
  distanceFromHost?: number;     // Distance in metres from the host's location
  distanceFromVerifier?: number; // Distance in metres from the verifier's location (if applicable)
  requiredRadius?: number;       // The configured radius in metres for this session
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
  termId?: string;
  remarks?: string;
}) {
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
      termId: data.termId,
      remarks: data.remarks,
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
  sessionId: string,  // UUID of the session to update
  hostId: string,     // UUID of the user making the update (must be the session host)
  latitude: number,   // New GPS latitude
  longitude: number   // New GPS longitude
) {
  // Validate the new coordinates before persisting them
  if (!isValidCoordinates({ latitude, longitude })) {
    throw new Error("Invalid coordinates");
  }

  // Fetch the session to verify it exists and check host ownership
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found"); // Reject if the session doesn't exist
  }

  // Enforce that only the session host can update the host location
  if (session.hostId !== hostId) {
    throw new Error("Only the host can update host location");
  }

  // Persist the updated host coordinates
  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      hostLatitude: latitude,   // New latitude
      hostLongitude: longitude, // New longitude
    },
  });

  // Log the location update event to the audit trail
  await logAudit("UPDATE", "AttendanceSession", sessionId, hostId);
  // Return the updated session object
  return updated;
}

/**
 * Set verifier for session and update their location
 */
export async function setVerifier(
  sessionId: string,  // UUID of the session to update
  verifierId: string, // UUID of the user being assigned as verifier
  latitude: number,   // Verifier's initial GPS latitude
  longitude: number   // Verifier's initial GPS longitude
) {
  // Validate the verifier's coordinates before persisting them
  if (!isValidCoordinates({ latitude, longitude })) {
    throw new Error("Invalid coordinates");
  }

  // Update the session with the verifier's ID and initial location
  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      verifierId,                    // Assign the verifier
      verifierLatitude: latitude,    // Set the verifier's initial latitude
      verifierLongitude: longitude,  // Set the verifier's initial longitude
    },
  });

  // Log the verifier assignment event to the audit trail
  await logAudit("UPDATE", "AttendanceSession", sessionId, verifierId);
  // Return the updated session object
  return updated;
}

/**
 * Update verifier location
 */
export async function updateVerifierLocation(
  sessionId: string,  // UUID of the session to update
  verifierId: string, // UUID of the user making the update (must be the assigned verifier)
  latitude: number,   // New GPS latitude
  longitude: number   // New GPS longitude
) {
  // Validate the new coordinates before persisting them
  if (!isValidCoordinates({ latitude, longitude })) {
    throw new Error("Invalid coordinates");
  }

  // Fetch the session to verify it exists and check verifier ownership
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found"); // Reject if the session doesn't exist
  }

  // Enforce that only the assigned verifier can update the verifier location
  if (session.verifierId !== verifierId) {
    throw new Error("Only the assigned verifier can update verifier location");
  }

  // Persist the updated verifier coordinates
  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      verifierLatitude: latitude,   // New latitude
      verifierLongitude: longitude, // New longitude
    },
  });

  // Log the location update event to the audit trail
  await logAudit("UPDATE", "AttendanceSession", sessionId, verifierId);
  // Return the updated session object
  return updated;
}

/**
 * Verify if student location is valid for marking attendance
 */
export async function verifyStudentLocation(
  sessionId: string,         // UUID of the session to verify against
  studentCoord: Coordinates  // The student's current GPS coordinates
): Promise<LocationVerificationResult> {
  // Fetch the session to get its configuration
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return { allowed: false, reason: "Session not found" }; // Session must exist
  }

  if (!session.isActive) {
    return { allowed: false, reason: "Session is not active" }; // Session must be active
  }

  // Validate student coordinates — reject impossible or spoofed values
  if (!isValidCoordinates(studentCoord)) {
    return { allowed: false, reason: "Invalid student coordinates" };
  }

  // Check if host location is set — required for distance verification
  if (session.hostLatitude === null || session.hostLongitude === null) {
    return {
      allowed: false,
      reason: "Host location not set. Please ask the teacher to enable location.",
    };
  }

  // Build the host's coordinate object for distance calculation
  const hostCoord: Coordinates = {
    latitude: session.hostLatitude,
    longitude: session.hostLongitude,
  };

  // Check if the student is within the allowed radius of the host
  const hostCheck = isWithinRadius(studentCoord, hostCoord, session.radiusMeters);

  if (!hostCheck.isWithin) {
    // Student is too far from the host — return a descriptive error
    return {
      allowed: false,
      reason: `You are ${hostCheck.distance}m away from the teacher. Required: within ${session.radiusMeters}m`,
      distanceFromHost: hostCheck.distance,
      requiredRadius: session.radiusMeters,
    };
  }

  // If verifier is required, check verifier location as well
  if (session.requireVerifier) {
    if (!session.verifierId) {
      return {
        allowed: false,
        reason: "Verifier is required but not assigned for this session",
      };
    }

    // Check if the verifier's location has been set
    if (session.verifierLatitude === null || session.verifierLongitude === null) {
      return {
        allowed: false,
        reason: "Verifier location not set. Please ask the verifier to enable location.",
      };
    }

    // Build the verifier's coordinate object for distance calculation
    const verifierCoord: Coordinates = {
      latitude: session.verifierLatitude,
      longitude: session.verifierLongitude,
    };

    // Check if the student is within the allowed radius of the verifier
    const verifierCheck = isWithinRadius(studentCoord, verifierCoord, session.radiusMeters);

    if (!verifierCheck.isWithin) {
      // Student is too far from the verifier — return a descriptive error
      return {
        allowed: false,
        reason: `You are ${verifierCheck.distance}m away from the verifier. Required: within ${session.radiusMeters}m`,
        distanceFromHost: hostCheck.distance,
        distanceFromVerifier: verifierCheck.distance,
        requiredRadius: session.radiusMeters,
      };
    }
  }

  // All checks passed — return allowed with distance information
  return {
    allowed: true,
    distanceFromHost: hostCheck.distance, // Distance from host in metres
    // Include verifier distance only if a verifier is required
    distanceFromVerifier: session.requireVerifier ? isWithinRadius(studentCoord, {
      latitude: session.verifierLatitude!,  // Non-null assertion: checked above
      longitude: session.verifierLongitude!, // Non-null assertion: checked above
    }, session.radiusMeters).distance : undefined,
    requiredRadius: session.radiusMeters, // The configured radius for reference
  };
}

/**
 * Mark student attendance with location verification
 */
export async function markAttendanceWithLocation(
  sessionId: string,  // UUID of the active session
  userId: string,     // UUID of the student marking their attendance
  latitude: number,   // Student's GPS latitude
  longitude: number,  // Student's GPS longitude
  timestamp: Date     // Client-provided timestamp of the location reading
) {
  // Anti-tamper: Check if timestamp is fresh — reject stale location data
  if (!isTimestampFresh(timestamp, 60)) {
    throw new Error("Location timestamp is too old. Please refresh and try again.");
  }

  // Build the student's coordinate object for verification
  const studentCoord: Coordinates = { latitude, longitude };

  // Run the full location verification (distance from host and verifier)
  const verification = await verifyStudentLocation(sessionId, studentCoord);

  if (!verification.allowed) {
    // Throw the descriptive reason from the verification result
    throw new Error(verification.reason || "Location verification failed");
  }

  // Fetch the session to get the session date for the attendance record
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found"); // Should not happen after verification passed
  }

  // Check for previous attendance (anti-tamper: impossible speed)
  const previousRecord = await prisma.attendanceRecord.findFirst({
    where: {
      userId,
      checkInAt: { not: null }, // Only consider records with a check-in time
    },
    orderBy: { checkInAt: "desc" }, // Get the most recent check-in
  });

  // If a previous check-in exists, verify the implied travel speed is realistic
  if (previousRecord && previousRecord.latitude && previousRecord.longitude && previousRecord.checkInAt) {
    // Calculate the time difference in seconds between the previous and current check-in
    const timeDiff = (timestamp.getTime() - previousRecord.checkInAt.getTime()) / 1000;
    // Only check speed if the previous check-in was within the last hour
    if (timeDiff > 0 && timeDiff < 3600) {
      const prevCoord: Coordinates = {
        latitude: previousRecord.latitude,
        longitude: previousRecord.longitude,
      };
      // Reject if the implied speed between the two locations is physically impossible
      if (!isSpeedRealistic(prevCoord, studentCoord, timeDiff)) {
        throw new Error("Impossible travel speed detected. Please contact administrator.");
      }
    }
  }

  // Use server timestamp as the source of truth for check-in time
  const serverNow = new Date()
  const record = await prisma.attendanceRecord.create({
    data: {
      userId,
      date: session.date,
      checkInAt: serverNow,
      latitude,
      longitude,
      status: AttendanceStatus.PRESENT,
      sessionId,
      verifiedBy: session.verifierId || undefined,
    },
  });

  // Log the attendance marking event to the audit trail
  await logAudit("CREATE", "AttendanceRecord", record.id, userId);
  // Check if the student has exceeded the absence limit
  await checkAndMarkAbsences(userId);
  // Return the created attendance record
  return record;
}

/**
 * Get active sessions
 */
export async function getActiveSessions(filters?: {
  sectionId?: string; // Optional section ID to filter sessions
  flightId?: string;  // Optional flight ID to filter sessions
}) {
  // Build the where clause — always filter for active sessions
  const where: Record<string, unknown> = { isActive: true };
  // Add optional section filter if provided
  if (filters?.sectionId) where.sectionId = filters.sectionId;
  // Add optional flight filter if provided
  if (filters?.flightId) where.flightId = filters.flightId;

  // Fetch active sessions with host, verifier, section, and flight data included
  return prisma.attendanceSession.findMany({
    where,
    include: {
      host: {
        select: {
          id: true,    // Host's user ID
          email: true, // Host's email address
          implementorProfile: { select: { firstName: true, lastName: true } },   // Implementor name
          cadetOfficerProfile: { select: { firstName: true, lastName: true } },  // Cadet officer name
        },
      },
      verifier: {
        select: {
          id: true,    // Verifier's user ID
          email: true, // Verifier's email address
          implementorProfile: { select: { firstName: true, lastName: true } },   // Implementor name
          cadetOfficerProfile: { select: { firstName: true, lastName: true } },  // Cadet officer name
        },
      },
      section: true, // Include the full section object
      flight: true,  // Include the full flight object
    },
    orderBy: { startTime: "desc" }, // Most recently started sessions first
  });
}

/**
 * End attendance session
 */
export async function endSession(sessionId: string, hostId: string, remarks?: string) {
  // Fetch the session to verify it exists and check host ownership
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.hostId !== hostId) {
    throw new Error("Only the host can end the session");
  }

  // Auto-mark ABSENT for enrolled students who did not check in
  const enrolledStudents = await prisma.studentProfile.findMany({
    where: {
      OR: [
        { sectionId: session.sectionId ?? undefined },
        { flightId: session.flightId ?? undefined }
      ].filter(w => w.sectionId || w.flightId)
    },
    select: { userId: true }
  })

  const markedUserIds = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    select: { userId: true }
  })

  const markedSet = new Set(markedUserIds.map(r => r.userId))
  const absentStudents = enrolledStudents.filter(s => !markedSet.has(s.userId))

  if (absentStudents.length > 0) {
    await prisma.attendanceRecord.createMany({
      data: absentStudents.map(student => ({
        userId: student.userId,
        date: session.date,
        status: "ABSENT" as const,
        sessionId
      }))
    })
  }

  // Mark the session as inactive, record end time, and save remarks
  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endTime: new Date(),
      remarks: remarks || session.remarks
    },
  });

  await logAudit("UPDATE", "AttendanceSession", sessionId, hostId);
  return updated;
}

/**
 * Live feed for an active session — stats + most recent check-ins.
 * Polled by the Live Attendance Monitor page.
 */
export async function getSessionLiveFeed(sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { section: true, flight: true },
  });
  if (!session) throw new Error("Session not found");

  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    orderBy: [{ checkInAt: "desc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          studentProfile: {
            select: { firstName: true, lastName: true, studentNo: true },
          },
        },
      },
    },
  });

  const roster = await prisma.enrollment.count({
    where: {
      status: "APPROVED",
      ...(session.sectionId ? { sectionId: session.sectionId } : {}),
    },
  });

  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  return {
    session: {
      id: session.id,
      title: session.title,
      isActive: session.isActive,
      startTime: session.startTime,
      endTime: session.endTime,
      section: session.section ? { name: session.section.name, code: session.section.code } : null,
      flight: session.flight ? { name: session.flight.name } : null,
    },
    stats: {
      roster,
      present,
      late,
      absent,
      checkedIn: present + late,
      attendanceRate: roster > 0 ? Math.round(((present + late) / roster) * 100) : 0,
    },
    recent: records
      .filter((r) => r.checkInAt)
      .slice(0, 25)
      .map((r) => ({
        id: r.id,
        name: r.user.studentProfile
          ? `${r.user.studentProfile.firstName} ${r.user.studentProfile.lastName}`
          : r.user.email,
        studentNo: r.user.studentProfile?.studentNo ?? "",
        status: r.status,
        checkInAt: r.checkInAt,
      })),
  };
}

/**
 * Calendar view — attendance sessions within a date range (any role).
 */
export async function listSessionsInRange(filters: { from?: Date; to?: Date }) {
  const where: Record<string, unknown> = {};
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  return prisma.attendanceSession.findMany({
    where,
    select: {
      id: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      isActive: true,
      section: { select: { name: true, code: true } },
    },
    orderBy: { date: "asc" },
  });
}
