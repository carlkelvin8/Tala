/**
 * Geolocation utilities for attendance verification
 * Uses Haversine formula to calculate distance between coordinates
 */

// Earth's mean radius in kilometres — used in the Haversine distance formula
const EARTH_RADIUS_KM = 6371;

/* Interface representing a geographic point with latitude and longitude */
export interface Coordinates {
  latitude: number;  // Degrees north (+) or south (-) of the equator, range -90 to 90
  longitude: number; // Degrees east (+) or west (-) of the prime meridian, range -180 to 180
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
  coord1: Coordinates, // First geographic point
  coord2: Coordinates  // Second geographic point
): number {
  // Convert the first point's latitude from degrees to radians
  const lat1Rad = toRadians(coord1.latitude);
  // Convert the second point's latitude from degrees to radians
  const lat2Rad = toRadians(coord2.latitude);
  // Compute the difference in latitudes and convert to radians
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  // Compute the difference in longitudes and convert to radians
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  // Haversine formula intermediate value 'a' — the square of half the chord length
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + // Squared sine of half the latitude delta
    Math.cos(lat1Rad) *       // Cosine of the first latitude
      Math.cos(lat2Rad) *     // Cosine of the second latitude
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2); // Squared sine of half the longitude delta

  // Angular distance in radians using the atan2 form of the Haversine formula
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply the angular distance by Earth's radius to get kilometres
  const distanceKm = EARTH_RADIUS_KM * c;

  return distanceKm * 1000; // Convert to meters
}

// Helper: convert degrees to radians by multiplying by π/180
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if coordinates are within acceptable range
 */
export function isValidCoordinates(coord: Coordinates): boolean {
  return (
    coord.latitude >= -90 &&   // Latitude must be at least -90 (South Pole)
    coord.latitude <= 90 &&    // Latitude must be at most 90 (North Pole)
    coord.longitude >= -180 && // Longitude must be at least -180 (International Date Line west)
    coord.longitude <= 180     // Longitude must be at most 180 (International Date Line east)
  );
}

/**
 * Check if student is within allowed radius of reference location
 */
export function isWithinRadius(
  studentCoord: Coordinates,   // The student's current GPS coordinates
  referenceCoord: Coordinates, // The reference point (teacher or verifier location)
  radiusMeters: number         // Maximum allowed distance in metres
): { isWithin: boolean; distance: number } {
  // Calculate the straight-line distance between the two points in metres
  const distance = calculateDistance(studentCoord, referenceCoord);
  return {
    isWithin: distance <= radiusMeters, // true if the student is inside the allowed radius
    distance: Math.round(distance),     // Round to the nearest metre for display purposes
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
  prevCoord: Coordinates,        // The earlier recorded GPS position
  newCoord: Coordinates,         // The newer GPS position to validate
  timeDiffSeconds: number,       // Elapsed time between the two positions in seconds
  maxSpeedKmh: number = 120      // Speed threshold above which movement is considered impossible
): boolean {
  // A non-positive time difference is physically impossible — reject immediately
  if (timeDiffSeconds <= 0) return false;

  // Convert the distance between the two points from metres to kilometres
  const distanceKm = calculateDistance(prevCoord, newCoord) / 1000;
  // Compute the implied speed: distance ÷ time (in hours)
  const speedKmh = (distanceKm / timeDiffSeconds) * 3600;

  // Return true only if the implied speed is within the allowed maximum
  return speedKmh <= maxSpeedKmh;
}

/**
 * Anti-tamper: Check if timestamp is not too old (stale)
 * @param timestamp Timestamp to check
 * @param maxAgeSeconds Maximum age in seconds (default: 60 seconds)
 */
export function isTimestampFresh(
  timestamp: Date,           // The timestamp to evaluate
  maxAgeSeconds: number = 60 // Maximum acceptable age in seconds before the timestamp is stale
): boolean {
  // Capture the current server time
  const now = new Date();
  // Compute how many seconds have elapsed since the provided timestamp
  const ageSeconds = (now.getTime() - timestamp.getTime()) / 1000;
  // Return true only if the timestamp is within the allowed age window
  return ageSeconds <= maxAgeSeconds;
}
