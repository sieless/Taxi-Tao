# Driver Location Flow - Comprehensive Documentation

## Overview

The Taxi-Tao system uses **two distinct location tracking mechanisms** for drivers:

1. **Static Location (Area-Based)**: `currentLocation` string stored in `/drivers/{driverId}` - used for matching drivers to ride requests by geographic area
2. **Real-Time GPS Location**: `driverLocation` coordinates stored in `/bookingRequests/{bookingId}` - used for live tracking during active rides

---

## 1. Static Location (Area-Based Matching)

### Purpose
Matches drivers to booking requests based on their operating area (e.g., "Nairobi", "Mombasa").

### Data Structure

**Location in Firestore:**
```
/drivers/{driverId}
  └── currentLocation: string (e.g., "Nairobi", "Mombasa")
```

**Type Definition:**
```typescript
// lib/types.ts (line 29)
export interface Driver {
  // ...
  currentLocation?: string; // Operating area/region
  // ...
}
```

### Storage Location
- **Collection**: `drivers`
- **Document**: `{driverId}`
- **Field**: `currentLocation` (string)

### Update Mechanism

**File**: `app/driver/dashboard/page.tsx` (lines 244-260)

```typescript
async function updateLocation(newLocation: string) {
  if (!driver) return;
  setLocationUpdating(true);
  try {
    await updateDoc(doc(db, "drivers", driver.id), {
      currentLocation: newLocation,
    });
    setDriver((prev) =>
      prev ? { ...prev, currentLocation: newLocation } : null
    );
  } catch (error) {
    console.error("Error updating location:", error);
    alert("Failed to update location.");
  } finally {
    setLocationUpdating(false);
  }
}
```

**UI Component**: Dropdown selector in driver dashboard
- Location: `app/driver/dashboard/page.tsx` (lines 940-975)
- Options: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika, Malindi, Kitui, Machakos, Makueni

### Usage in Matching

**1. Booking Request Creation** (`lib/booking-service.ts`, lines 104-132)
```typescript
// Find drivers in the pickup location area
const driversRef = collection(db, "drivers");
const q = query(
  driversRef,
  where("status", "==", "available"),
  where("subscriptionStatus", "==", "active"),
  where("currentLocation", "==", data.pickupLocation) // Area-based matching
);
```

**2. Fetching Available Bookings** (`lib/booking-service.ts`, lines 216-238)
```typescript
export async function getAvailableBookings(
  driverLocation: string
): Promise<BookingRequest[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("status", "==", "pending"),
    where("pickupLocation", "==", driverLocation) // Match by area
  );
  // ...
}
```

**3. Statistics & Counts** (`lib/earnings-service.ts`, lines 129-143)
```typescript
export async function getNewRequestsCount(location: string): Promise<number> {
  const q = query(
    collection(db, "bookingRequests"),
    where("status", "==", "pending"),
    where("pickupLocation", "==", location) // Count requests in driver's area
  );
  // ...
}
```

### Firestore Security Rules

**File**: `firestore.rules` (lines 145-173)

```javascript
match /drivers/{driverId} {
  // Drivers can update their own profile (including currentLocation)
  allow update: if isSignedIn() && (
    (request.auth.uid == driverId && isEmailVerified()) ||
    isAdmin()
  );
}
```

**Permissions:**
- ✅ Drivers can update their own `currentLocation`
- ✅ Admins can update any driver's `currentLocation`
- ✅ All authenticated users with verified email can read (for booking flow)

---

## 2. Real-Time GPS Location (Live Tracking)

### Purpose
Tracks driver's exact GPS coordinates during active rides for customer live tracking.

### Data Structure

**Location in Firestore:**
```
/bookingRequests/{bookingId}
  └── driverLocation: {
        lat: number,
        lng: number,
        lastUpdated: Timestamp
      }
```

**Type Definition:**
```typescript
// lib/types.ts (lines 108-113)
export interface BookingRequest {
  // ...
  driverLocation?: {
    lat: number;
    lng: number;
    lastUpdated: any; // Firestore Timestamp
  };
  // ...
}
```

### Storage Location
- **Collection**: `bookingRequests`
- **Document**: `{bookingId}`
- **Field**: `driverLocation` (object with lat, lng, lastUpdated)

### Core Implementation Files

#### A. Location Tracking Service

**File**: `lib/ride-tracking.ts`

**Main Functions:**

1. **Start Location Tracking** (lines 78-164)
   ```typescript
   export async function startLocationTracking(
     bookingId: string,
     destinationCoords?: { lat: number; lng: number },
     onError?: (error: Error) => void
   ): Promise<void>
   ```
   
   **Flow:**
   - Stops any existing tracking session
   - Gets initial GPS location using `getCurrentLocation()` from `lib/maps.ts`
   - Updates Firestore with initial location
   - Starts 30-second interval tracking
   - Updates location every 30 seconds
   - Optionally checks for auto-completion when near destination

2. **Update Driver Location** (lines 188-207)
   ```typescript
   async function updateDriverLocation(
     bookingId: string,
     location: { lat: number; lng: number }
   ): Promise<void>
   ```
   
   **Updates Firestore:**
   ```typescript
   await updateDoc(bookingRef, {
     driverLocation: {
       lat: location.lat,
       lng: location.lng,
       lastUpdated: Timestamp.now(),
     },
   });
   ```

3. **Stop Location Tracking** (lines 171-181)
   ```typescript
   export function stopLocationTracking(): void
   ```
   - Clears interval timer
   - Stops geolocation watch

#### B. Maps Utility Functions

**File**: `lib/maps.ts`

**Key Functions:**

1. **Get Current Location** (lines 107-157)
   ```typescript
   export function getCurrentLocation(): Promise<{ lat: number; lng: number }>
   ```
   - Uses browser `navigator.geolocation.getCurrentPosition()`
   - High accuracy mode with fallback to low accuracy
   - Returns `{ lat, lng }` coordinates

2. **Watch Location** (lines 163-188)
   ```typescript
   export function watchLocation(
     callback: (location: { lat: number; lng: number }) => void
   ): number
   ```
   - Continuous GPS watching
   - Returns watchId for cleanup

3. **Calculate Distance** (lines 30-48)
   ```typescript
   export function calculateDistance(
     origin: { lat: number; lng: number },
     destination: { lat: number; lng: number }
   ): number
   ```
   - Uses Haversine formula (free, no API calls)
   - Returns distance in kilometers

4. **Calculate ETA** (lines 58-101)
   ```typescript
   export async function calculateETA(
     origin: { lat: number; lng: number },
     destination: { lat: number; lng: number }
   ): Promise<{ minutes: number; distance: string } | null>
   ```
   - Uses Google Distance Matrix API (costs apply - limited to 3 calls per trip)
   - Returns ETA in minutes and distance

### Trigger Points

**File**: `components/UpcomingBookings.tsx` (lines 260-304)

Location tracking starts when driver updates ride status to:
- `"en_route"` - Driver starts journey to pickup
- `"in_progress"` - Trip has started

```typescript
if (newStatus === "en_route" || newStatus === "in_progress") {
  startLocationTracking(
    bookingId,
    (booking as any).destinationCoords,
    (error) => { /* error handling */ }
  );
}
```

Tracking stops when:
- Ride status changes to `"completed"`
- Component unmounts
- Driver switches to different booking

### Error Handling

**Geolocation Error Codes:**
- `1`: Permission denied
- `2`: Position unavailable (GPS/Signal lost)
- `3`: Timeout

**Error Handling** (`lib/ride-tracking.ts`, lines 132-163):
- Sanitizes error messages
- Provides user-friendly error descriptions
- Calls `onError` callback for UI display

### Customer-Side Display

**File**: `app/customer/track/[bookingId]/page.tsx`

**Real-Time Updates:**
```typescript
// Uses Firestore onSnapshot for real-time updates
const unsubscribe = onSnapshot(
  bookingRef,
  (snapshot) => {
    const bookingData = { id: snapshot.id, ...snapshot.data() } as BookingRequest;
    setBooking(bookingData); // Updates when driverLocation changes
  }
);
```

**Map Display:**
```typescript
<LiveDriverMap
  driverPosition={booking.driverLocation ? {
    lat: booking.driverLocation.lat,
    lng: booking.driverLocation.lng
  } : null}
  pickupPosition={{ lat: -1.286389, lng: 36.817223 }}
  eta={booking.driverLocation ? 15 : undefined}
/>
```

**File**: `components/LiveMap.tsx` / `components/LiveDriverMap.tsx`
- Displays driver marker on Google Maps
- Updates marker position when `driverLocation` changes
- Shows pickup and destination markers

### Firestore Security Rules

**File**: `firestore.rules` (lines 206-226)

```javascript
match /bookingRequests/{bookingId} {
  // Update logic - multi-party access
  allow update: if isSignedIn() && isEmailVerified() && (
    // Driver who accepted the booking (can update status and location)
    request.auth.uid == resource.data.acceptedBy ||
    // ... other conditions
  );
}
```

**Permissions:**
- ✅ Driver who accepted the booking can update `driverLocation`
- ✅ Customer who created the booking can read `driverLocation`
- ✅ All authenticated users with verified email can read (for matching)

---

## 3. Location Flow Diagrams

### Static Location Flow (Area Matching)

```
┌─────────────────┐
│  Driver Dashboard │
│  Sets Location   │
│  (Dropdown)      │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Update Firestore │
│ /drivers/{id}   │
│ currentLocation │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Customer Creates│
│  Booking Request │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Match Drivers    │
│ by currentLocation│
│ == pickupLocation│
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Notify Matched  │
│   Drivers       │
└─────────────────┘
```

### Real-Time GPS Flow (Live Tracking)

```
┌─────────────────┐
│ Driver Updates   │
│ Status: en_route │
│ or in_progress   │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ startLocation    │
│ Tracking()      │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Get GPS Location│
│ (Browser API)   │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Update Firestore│
│ /bookingRequests│
│ /{id}/driver    │
│ Location        │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Every 30 seconds│
│ (Interval)      │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Customer View   │
│ (Real-time via  │
│  onSnapshot)    │
└─────────────────┘
```

---

## 4. Key Dependencies

### Browser APIs
- `navigator.geolocation.getCurrentPosition()` - One-time location
- `navigator.geolocation.watchPosition()` - Continuous tracking
- Requires user permission (HTTPS required in production)

### Firebase Services
- **Firestore**: Storage for both location types
- **onSnapshot**: Real-time updates for customers
- **updateDoc**: Location updates from driver

### External APIs
- **Google Maps JavaScript API**: Map display
- **Google Distance Matrix API**: ETA calculations (limited usage)

### Environment Variables
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Required for maps and ETA

---

## 5. File Structure Summary

### Core Location Files

```
lib/
├── ride-tracking.ts          # Real-time GPS tracking (active rides)
├── maps.ts                   # Geolocation utilities, distance, ETA
├── location-service.ts       # Alternative location service (legacy/unused?)
└── types.ts                  # TypeScript interfaces

app/driver/dashboard/
└── page.tsx                  # Static location selector, triggers tracking

components/
├── UpcomingBookings.tsx      # Starts/stops location tracking
├── LiveMap.tsx               # Map display component
└── LiveDriverMap.tsx         # Customer tracking map

app/customer/track/
└── [bookingId]/page.tsx      # Real-time driver location display
```

---

## 6. Important Notes

### Static vs Real-Time Location

- **Static (`currentLocation`)**: 
  - Manual selection by driver (dropdown)
  - Used for area-based matching
  - Stored in `/drivers/{id}`
  - Does NOT update automatically

- **Real-Time (`driverLocation`):
  - Automatic GPS tracking
  - Used for live customer tracking
  - Stored in `/bookingRequests/{id}`
  - Updates every 30 seconds during active rides

### Performance Considerations

1. **GPS Updates**: 30-second interval balances battery life vs accuracy
2. **ETA Calculations**: Limited to 3 calls per trip (cost control)
3. **Real-time Listeners**: Use `onSnapshot` efficiently to avoid excessive reads

### Security

- Location updates require authenticated, verified email users
- Drivers can only update their own `currentLocation` in profile
- Drivers can only update `driverLocation` for bookings they accepted
- Customers can read `driverLocation` for their bookings

### Browser Compatibility

- Requires HTTPS (or localhost) for geolocation API
- Modern browsers support geolocation API
- Graceful fallback when geolocation unavailable

---

## 7. Future Enhancements (Potential)

1. **Geofencing**: Auto-update `currentLocation` based on GPS
2. **Background Tracking**: Service worker for background location updates
3. **Location History**: Store location trail for completed rides
4. **Offline Support**: Queue location updates when offline
5. **Battery Optimization**: Adaptive update intervals based on battery level

---

## End of Documentation







