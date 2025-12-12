# Mobile App Revamp & Parity Plan

This document outlines the comprehensive plan to bring the TaxiTao mobile app to full feature parity with the web platform, fix critical synchronization issues, and implement missing core features.

## 🛑 Critical Issues & Sync Gaps (Current State)
- **Driver Visibility**: Toggling "Online" in the app does **not** update the server. The dispatcher sees drivers as "Offline".
- **Notifications**: Push notifications are disabled/stubbed. Users miss ride updates.
- **Ride Flow**: Only supports `Pending` -> `Accepted`. Missing `Arrived`, `In Progress`, `Completed`.
- **Pricing**: Fares are hardcoded to 500 KSH.
- **Location**: Destination coordinates are mocked (fake).

---

## 📅 Implementation Phases

### Phase 1: Core Connectivity & State (The Foundation)
*Goal: Ensure drivers are visible to the system and users can communicate.*

#### 1.1 Driver Presence Sync (High Priority)
- **Task**: Update `dashboard.tsx` to write to Firestore `drivers/{uid}` when toggling online/offline.
- **Details**:
  - On "Go Online": Update `status: 'available'`, `currentLocation: <lat,lng>`, `lastActive: serverTimestamp()`.
  - On "Go Offline": Update `status: 'offline'`.
  - **Sync Check**: Verify web admin panel sees the driver status change.

#### 1.2 Push Notifications
- **Task**: Implement `notifications.ts` to actually register Expo push tokens.
- **Details**:
  - Request permissions on app launch.
  - Save `pushToken` to `users/{uid}` in Firestore.
  - Add listeners to handle incoming notifications (e.g., navigate to ride screen).

#### 1.3 Real Location & Geocoding
- **Task**: Replace mocked destination logic in `RideRequestForm`.
- **Details**:
  - Integrate a geocoding service (Google Maps or OpenStreetMap/Nominatim) to convert "Destination Name" to Lat/Lng.
  - *Note: Requires API Key configuration.*

---

### Phase 2: The Ride Lifecycle (The Flow)
*Goal: Enable the full ride experience from pickup to dropoff.*

#### 2.1 Advanced Ride States
- **Task**: Update `RideService` and Driver UI to support full lifecycle.
- **Details**:
  - Add `updateRideStatus(rideId, status)` function.
  - **Driver UI**: Add buttons/slider for:
    - "I've Arrived" (Updates status to `arrived`, notifies customer).
    - "Start Trip" (Updates status to `in_progress`).
    - "Complete Trip" (Updates status to `completed`, calculates final fare).

#### 2.2 Active Ride Screens
- **Task**: Create dedicated "Ride in Progress" views.
- **Details**:
  - **Driver**: Show navigation to destination, customer info, "Emergency" button.
  - **Customer**: Show driver location (live tracking), ETA, "Call Driver" button.

---

### Phase 3: Financials & History (The Value)
*Goal: Make the app useful for business tracking.*

#### 3.1 Dynamic Pricing Engine
- **Task**: Remove hardcoded 500 KSH fare.
- **Details**:
  - Fetch pricing rates from `pricing_strategies` (or similar) collection.
  - **Logic**:
    - If route price exists: Calculate fare based on `(Distance * Rate) + Base Fare`.
    - If **NO** route price exists: Driver is prompted to enter a price upon accepting the ride. Client must confirm this price.
  - Display estimated range to customer before booking.

#### 3.2 Driver Earnings & Dashboard
- **Task**: Populate the empty "0" stats in Driver Dashboard.
- **Details**:
  - Listen to `drivers/{uid}` for `totalEarnings`, `totalRides`.
  - Create a "History" tab to list completed rides (query `bookingRequests` where `driverId == uid` and `status == completed`).

---

## 🛠️ Execution & Commit Strategy

### How to Run & Test
1.  **Clean Start**: Always run `npx expo start --clear` to ensure no cache issues.
2.  **Dual Testing**: You need two devices (or 1 simulator + 1 phone) to test the flow:
    - **Device A (Driver)**: Logged in, set to "Online".
    - **Device B (Customer)**: Requesting a ride.

### Best Practice Commit Steps
Follow "Conventional Commits" to keep history clean. Commit after completing each sub-phase.

1.  **Setup/Fixes**:
    - `fix(driver): sync online status to firestore`
    - `feat(notifications): enable expo push token registration`
2.  **Features**:
    - `feat(ride): implement arrived and in-progress states`
    - `feat(pricing): replace hardcoded fare with distance calculation`
3.  **UI/Polish**:
    - `style(dashboard): improve active ride card layout`

---

## 🚀 Getting Started
We will start immediately with **Phase 1.1: Driver Presence Sync**. This is the most critical fix to make the mobile app "real" to the rest of the system.
