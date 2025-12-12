## Mobile Audit (Android) vs TaxiTao Web

### Scope

- No code changes; static review of mobile vs web (root app).
- Focus: feature parity, Firestore/fetch calls, Firebase rules fit, and obvious non-responding areas.

### Web Feature Baseline (root project)

- Booking flow with customer notifications and driver matching filtered by `status`, `subscriptionStatus`, and `currentLocation`.
- Driver dashboard (earnings, ride history, location warnings), ratings, ride completion, and negotiations.
- Admin panel: payments/subscriptions, verification, pricing, compliance.
- Notifications: customer + driver notifications collections, driverNotifications, and client issues.
- Firestore rules enforce role-based access, booking ownership, driver-only queries, and expiry checks.

### Mobile Feature Snapshot

- Auth (email/password) with role-based redirect; auto-creates a customer profile if missing.
- Customer: map view, simple ride request form, listens to a single booking’s status.
- Driver: toggle Online, listen to pending bookings, accept ride; no stats/earnings/subscription UI.
- Push notifications intentionally disabled; no in-app notifications logic.

### Non-Responding / Misaligned Items

- **Ride request schema mismatch**: mobile writes `bookingRequests` with only pickup/destination strings, lat/lng, `fareEstimate`, `status`, `createdAt`, `notifiedDrivers`; missing `pickupDate`, `pickupTime`, and especially `expiresAt`. Web logic expects these fields and filters out expired rides, so mobile-created rides may be ignored or break expiry checks.
  ```1:48:mobile/lib/ride-service.ts
  const docRef = await addDoc(collection(db, "bookingRequests"), {
    customerId,
    customerName,
    customerPhone,
    pickupLocation: pickup.address,
    ...,
    fareEstimate,
    status: "pending",
    createdAt: serverTimestamp(),
    notifiedDrivers: [],
  });
  ```
- **No driver/location filtering when listening**: mobile drivers subscribe to all pending `bookingRequests` (no `pickupLocation`/subscription/status filter). Web matches by location + active subscription, so mobile drivers may see irrelevant rides; Firestore rules also expect driver role for listing and will error silently if the signed-in user lacks `role: driver`.
  ```48:62:mobile/lib/ride-service.ts
  const q = query(
    collection(db, "bookingRequests"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  ```
- **Accept flow is non-atomic**: mobile `acceptRide` does a blind update without checking `status`, expiry, or collisions. Web uses a transaction with pending/expiry checks; concurrent accepts will race, leading to double acceptance or stale data.
  ```74:89:mobile/lib/ride-service.ts
  await updateDoc(rideRef, {
    status: "accepted",
    acceptedBy: driverId,
    driverName,
    driverPhone,
    acceptedAt: serverTimestamp(),
  });
  ```
- **No customer/driver notifications**: mobile never writes to `notifications` or `driverNotifications`; push registration is stubbed (returns null). Users won’t get alerts for booking creation/acceptance or ride status.
  ```16:53:mobile/lib/notifications.ts
  // Expo notifications disabled; returns null token
  console.log("Push Notifications disabled for Expo Go");
  return null;
  ```
- **Ride status lifecycle missing**: mobile only sets `status` to `pending`/`accepted`; no `rideStatus` transitions (en_route/arrived/in_progress/completed), no completion, no ratings. Web expects these for dashboard, history, and permissions.
- **Driver state not updated**: mobile dashboard doesn’t set `drivers.status`, `currentLocation`, or `subscriptionStatus`; web matching and rules depend on these fields. Going “Online” is local state only.
- **Booking view filters likely fail**: web `getAvailableBookings` filters by `pickupLocation` and `expiresAt`; mobile-created documents lack these fields, so web drivers may see empty lists or runtime errors when reading `expiresAt`.
- **Legacy rideRequests unused**: Firestore rules allow `rideRequests` collection, but mobile uses `bookingRequests` only; web has `ride-request-service` for the fallback flow. Parity gap if backend expects `rideRequests` for “no driver” cases.
- **Payments/subscriptions absent**: no mobile UI or calls for subscription payments, verification status, or compliance alerts present in web/admin flows.

### Firebase Rules Fit (risk)

- `bookingRequests` list/get require signed-in driver/admin; mobile doesn’t surface errors if the user lacks `role: driver` → “no rides” with no message.
- `bookingRequests` update allows drivers only when `status == 'pending'` or `acceptedBy == uid`; mobile blind update could be rejected if rules enforce pending (they do), but there’s no error handling in the snapshot listener to show permission issues.
- Push token registration is null, so even if rules allow storing `pushToken`, nothing is saved.

### Proposed Fixes (no code applied yet)

- Align `bookingRequests` schema with web: include `pickupDate`, `pickupTime`, `expiresAt`, and set `status` initial value consistent with web (`pending` vs `assigned`). Add `notifiedDrivers` array initialization and ensure phone/customerId fields match web expectations.
- Driver feed query: filter by driver’s `currentLocation`, `status == 'available'`, and `subscriptionStatus == 'active'`; add error handler for permission denials.
- Accept ride: use a Firestore transaction checking `status == pending` and `expiresAt` > now; on success, create customer notification and update ride status fields.
- Notifications: enable Expo push registration (native build), save `pushToken` to `users/{uid}`, and create Firestore notifications/driverNotifications to mirror web behavior.
- Driver state: when toggling Online, update `drivers/{driverId}` with `status: 'available'`, `currentLocation` (from GPS or profile), and lastActive timestamp.
- Ride lifecycle: add transitions (en_route, arrived, in_progress, completed), driver location updates, and customer rating flow to match web dashboards/history.
- Parity gaps: add subscription/payment visibility and earnings summary for drivers; surface booking history for customers; consider negotiation support or at least fare updates.

### Phased Implementation Plan (Android)

1. **Schema + Queries (critical)**
   - Update mobile `bookingRequests` writes to include `pickupDate`, `pickupTime`, `expiresAt`, `notifiedDrivers`, `status` parity.
   - Driver listener: filter by `pickupLocation` (driver currentLocation), `status == 'pending'`, `subscriptionStatus == 'active'`, `status == 'available'` on driver profile; handle permission errors visibly.
   - Add transaction-based accept with pending/expiry guard.
2. **Notifications + Driver presence**
   - Enable push token capture (Expo build), persist to `users/{uid}`.
   - On booking create/accept, write `notifications` and `driverNotifications` matching web types.
   - Online toggle updates `drivers/{driverId}` (`status`, `currentLocation`, `lastActive`), and optionally stores last known GPS.
3. **Ride lifecycle + UX parity**
   - Add ride status transitions (en_route/arrived/in_progress/completed), driver location updates during active rides, and customer rating flow.
   - Add driver earnings/ride history summaries and subscription/payment status visibility.
   - Improve customer booking history view and basic fare/negotiation placeholder.
4. **Polish + Validation**
   - Error handling for Firestore denials, empty feeds, expired bookings.
   - Optional: map/geocoding for accurate addresses; tidy UI states.

### What to test manually after fixes

- Driver (role=driver) sees only local-area pending rides; toggle Online/Offline updates Firestore.
- Customer requests a ride → driver receives notification → accepts → customer sees status change; Firestore rules permit reads/writes without permission errors.
- Booking expiry respected (expired rides not shown/accepted).
- Notifications delivered (push + in-app) for booking creation and acceptance.
