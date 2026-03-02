/**
 * Geolocation utilities for attendance verification
 * Uses Haversine formula to calculate distance between coordinates
 */

const EARTH_RADIUS_KM = 6371;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return distanceKm * 1000; // Convert to meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if coordinates are within acceptable range
 */
export function isValidCoordinates(coord: Coordinates): boolean {
  return (
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

/**
 * Check if student is within allowed radius of reference location
 */
export function isWithinRadius(
  studentCoord: Coordinates,
  referenceCoord: Coordinates,
  radiusMeters: number
): { isWithin: boolean; distance: number } {
  const distance = calculateDistance(studentCoord, referenceCoord);
  return {
    isWithin: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}

/**
 * Anti-tamper: Check if speed between two locations is physically possible
 * @param prevCoord Previous coordinates
 * @param newCoord New coordinates
 * @param timeDiffSeconds Time difference in seconds
 * @param maxSpeedKmh Maximum allowed speed in km/h (default: 120 km/h)
 */
export function isSpeedRealistic(
  prevCoord: Coordinates,
  newCoord: Coordinates,
  timeDiffSeconds: number,
  maxSpeedKmh: number = 120
): boolean {
  if (timeDiffSeconds <= 0) return false;

  const distanceKm = calculateDistance(prevCoord, newCoord) / 1000;
  const speedKmh = (distanceKm / timeDiffSeconds) * 3600;

  return speedKmh <= maxSpeedKmh;
}

/**
 * Anti-tamper: Check if timestamp is not too old (stale)
 * @param timestamp Timestamp to check
 * @param maxAgeSeconds Maximum age in seconds (default: 60 seconds)
 */
export function isTimestampFresh(
  timestamp: Date,
  maxAgeSeconds: number = 60
): boolean {
  const now = new Date();
  const ageSeconds = (now.getTime() - timestamp.getTime()) / 1000;
  return ageSeconds <= maxAgeSeconds;
}
