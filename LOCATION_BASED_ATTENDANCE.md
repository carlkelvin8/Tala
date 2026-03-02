# Location-Based Attendance System

## Overview
Added location-based attendance verification to ensure students can only mark attendance when physically present at the same location as the teacher/host and optional verifier.

## Features Added

### 1. Attendance Sessions
- Teachers/Admins can create attendance sessions with:
  - Title and date
  - Location (latitude/longitude)
  - Radius threshold (default: 50 meters, configurable)
  - Optional verifier requirement
  - Section/Flight assignment

### 2. Location Verification
- **Haversine Formula**: Accurate distance calculation between coordinates
- **Multi-point Verification**: Student must be within radius of:
  - Host/Teacher location (required)
  - Verifier location (if enabled)
- **Real-time Validation**: Server-side distance calculation

### 3. Anti-Tamper Measures
- **Coordinate Validation**: Ensures lat/long are within valid ranges
- **Timestamp Freshness**: Rejects stale location data (>60 seconds old)
- **Speed Check**: Detects impossible travel speeds between check-ins
- **Server-side Verification**: All validation happens on backend

### 4. Security Features
- HTTPS required for geolocation API
- Browser permission handling
- Detailed error messages via SweetAlert2
- Audit logging for all actions

## Database Schema Changes

### New Tables

#### AttendanceSession
```prisma
model AttendanceSession {
  id                    String    @id @default(uuid())
  title                 String
  date                  DateTime
  startTime             DateTime
  endTime               DateTime?
  hostId                String
  hostLatitude          Float?
  hostLongitude         Float?
  verifierId            String?
  verifierLatitude      Float?
  verifierLongitude     Float?
  radiusMeters          Int       @default(50)
  requireVerifier       Boolean   @default(false)
  isActive              Boolean   @default(true)
  sectionId             String?
  flightId              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

### Modified Tables

#### AttendanceRecord (Added Fields)
- `sessionId`: Links to attendance session
- `verifiedBy`: ID of verifier who validated attendance

## API Endpoints

### Create Session (Teacher/Admin)
```
POST /api/attendance-sessions
Body: {
  title: string
  date: string (ISO date)
  latitude: number
  longitude: number
  radiusMeters?: number (default: 50)
  requireVerifier?: boolean
  sectionId?: string
  flightId?: string
}
```

### Update Host Location
```
PATCH /api/attendance-sessions/:sessionId/host-location
Body: {
  latitude: number
  longitude: number
}
```

### Set Verifier
```
POST /api/attendance-sessions/:sessionId/verifier
Body: {
  verifierId: string
  latitude: number
  longitude: number
}
```

### Update Verifier Location
```
PATCH /api/attendance-sessions/:sessionId/verifier-location
Body: {
  latitude: number
  longitude: number
}
```

### Mark Attendance (Student)
```
POST /api/attendance-sessions/:sessionId/mark
Body: {
  latitude: number
  longitude: number
  timestamp: string (ISO timestamp)
}
```

### Get Active Sessions
```
GET /api/attendance-sessions/active?sectionId=xxx&flightId=xxx
```

### End Session
```
POST /api/attendance-sessions/:sessionId/end
```

## Location Verification Logic

### Student Can Mark PRESENT If:
1. ✅ Session is active
2. ✅ Host location is set
3. ✅ Student is within radius of host
4. ✅ If verifier required:
   - Verifier is assigned
   - Verifier location is set
   - Student is within radius of verifier
5. ✅ Location timestamp is fresh (<60 seconds)
6. ✅ No impossible speed detected

### Error Messages
- **Host location missing**: "Host location not set. Please ask the teacher to enable location."
- **Too far from host**: "You are 150m away from the teacher. Required: within 50m"
- **Verifier required but missing**: "Verifier is required but not assigned for this session"
- **Too far from verifier**: "You are 80m away from the verifier. Required: within 50m"
- **Stale timestamp**: "Location timestamp is too old. Please refresh and try again."
- **Impossible speed**: "Impossible travel speed detected. Please contact administrator."

## Frontend Integration

### For Teachers/Admins (Create Session)
```typescript
// Request geolocation
navigator.geolocation.getCurrentPosition(
  async (position) => {
    const response = await fetch('/api/attendance-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Morning Attendance',
        date: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusMeters: 50,
        requireVerifier: false,
        sectionId: 'section-id'
      })
    });
    
    if (response.ok) {
      Swal.fire('Success', 'Attendance session created!', 'success');
    }
  },
  (error) => {
    Swal.fire('Error', 'Please enable location access', 'error');
  }
);
```

### For Students (Mark Attendance)
```typescript
// Get active sessions
const sessions = await fetch('/api/attendance-sessions/active');

// Mark attendance
navigator.geolocation.getCurrentPosition(
  async (position) => {
    const response = await fetch(`/api/attendance-sessions/${sessionId}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString()
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      Swal.fire('Success', 'Attendance marked!', 'success');
    } else {
      Swal.fire('Error', data.message, 'error');
    }
  },
  (error) => {
    if (error.code === error.PERMISSION_DENIED) {
      Swal.fire('Permission Denied', 'Please enable location access in your browser', 'error');
    } else {
      Swal.fire('Error', 'Unable to get your location. Please ensure HTTPS is enabled.', 'error');
    }
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);
```

## Configuration

### Adjust Radius Threshold
Default is 50 meters. Can be changed per session:
```typescript
radiusMeters: 100 // 100 meters
```

### Adjust Timestamp Freshness
In `backend/src/lib/geolocation.ts`:
```typescript
isTimestampFresh(timestamp, 120) // 120 seconds instead of 60
```

### Adjust Speed Check
In `backend/src/lib/geolocation.ts`:
```typescript
isSpeedRealistic(prevCoord, newCoord, timeDiff, 200) // 200 km/h instead of 120
```

## Testing

### Test Distance Calculation
```typescript
import { calculateDistance } from './lib/geolocation';

const coord1 = { latitude: 14.5995, longitude: 120.9842 }; // Manila
const coord2 = { latitude: 14.6042, longitude: 120.9822 }; // ~500m away

const distance = calculateDistance(coord1, coord2);
console.log(`Distance: ${distance}m`); // ~523m
```

### Test Location Verification
```bash
# Create session
curl -X POST http://localhost:4000/api/attendance-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Session",
    "date": "2024-03-02",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "radiusMeters": 50
  }'

# Mark attendance (within radius)
curl -X POST http://localhost:4000/api/attendance-sessions/$SESSION_ID/mark \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 14.5996,
    "longitude": 120.9843,
    "timestamp": "2024-03-02T10:00:00Z"
  }'
```

## Migration

Run the migration to add new tables:
```bash
cd backend
npx prisma migrate dev --name add_location_based_attendance
npx prisma generate
```

## Files Added/Modified

### New Files
- `backend/src/lib/geolocation.ts` - Distance calculation and validation utilities
- `backend/src/services/attendanceSessionService.ts` - Session management and verification logic
- `backend/src/controllers/attendanceSessionController.ts` - API controllers
- `backend/src/routes/attendanceSessionRoutes.ts` - Route definitions

### Modified Files
- `backend/prisma/schema.prisma` - Added AttendanceSession model, updated AttendanceRecord
- `backend/src/app.ts` - Added attendance session routes

## Notes

- Browser geolocation can be spoofed, but server-side validation adds significant security
- HTTPS is required for geolocation API to work in browsers
- Location accuracy depends on device GPS capability
- Consider adding IP geolocation as additional verification layer
- Audit logs track all attendance actions for accountability

## Future Enhancements

1. **IP Geolocation**: Cross-reference GPS with IP location
2. **Photo Verification**: Require selfie with attendance
3. **QR Code**: Generate session-specific QR codes
4. **Geofencing**: Use polygon boundaries instead of radius
5. **Bluetooth Beacons**: Use BLE for indoor accuracy
6. **Face Recognition**: Verify student identity
7. **Historical Patterns**: Flag unusual attendance patterns
