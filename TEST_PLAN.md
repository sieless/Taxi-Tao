# Taxi-Tao Full System Test Plan

> Every step lists: **Action** → **Expected Result** → **Pass/Fail**
> Test in order. Each section is independent unless noted.

---

## SECTION 1: INFRASTRUCTURE & SECURITY

### 1.1 Proxy/Middleware Conflict
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run `npm run dev` | Server starts with no "Both middleware file and proxy file" errors |
| 2 | Confirm `middleware.ts` does NOT exist | Only `proxy.ts` exists in project root |

### 1.2 Security Headers
| Step | Action | Expected Result |
|------|--------|-----------------|
| 3 | Open DevTools > Network > load any page > inspect response headers | `X-Frame-Options: DENY` present |
| 4 | Same response headers | `X-Content-Type-Options: nosniff` present |
| 5 | Same response headers | `Referrer-Policy: strict-origin-when-cross-origin` present |
| 6 | Same response headers | `Permissions-Policy: camera=(), microphone=(), geolocation=()` present |
| 7 | Same response headers | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` present |
| 8 | Same response headers | `Content-Security-Policy` present with `nonce-` pattern (not `unsafe-inline`) |
| 9 | Check `x-nonce` header | Present and changes on each request |

### 1.3 Route Protection (Proxy)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 10 | Visit `/admin/dashboard` without login | Redirect to `/login?returnTo=/admin/dashboard` |
| 11 | Visit `/vendor/dashboard` without login | Redirect to `/login?returnTo=/vendor/dashboard` |
| 12 | Visit `/driver/dashboard` without login | Redirect to `/login?returnTo=/driver/dashboard` |
| 13 | Visit `/api/vendor/payments/confirm` without login | JSON `{ error: "Authentication required" }` with status 401 |
| 14 | Visit `/api/send-email` without login | JSON `{ error: "Authentication required" }` with status 401 |
| 15 | Visit `/login` while logged in | Redirect to `/` |
| 16 | Visit `/signup` while logged in | Redirect to `/` |

### 1.4 Rate Limiting
| Step | Action | Expected Result |
|------|--------|-----------------|
| 17 | POST to `/api/auth/session` with invalid token 6 times rapidly | 6th request returns status 429 (rate limited) |
| 18 | POST to `/api/send-email` 6 times rapidly | 6th request returns status 429 |

### 1.5 Input Validation (No Error Leaks)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 19 | POST to `/api/auth/session` with `{}` | Returns `{ error: "Validation failed" }` (no schema details) |
| 20 | POST to `/api/send-email` with `{}` | Returns `{ error: "Validation failed" }` (no `issues` array) |
| 21 | POST to `/api/vendor/payments/confirm` with `{}` | Returns `{ error: "Validation failed" }` |

---

## SECTION 2: AUTHENTICATION

### 2.1 Customer Signup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 22 | Navigate to `/signup` | Form visible: Name, Email, Phone, Password fields |
| 23 | Submit with empty name | Validation error on name field |
| 24 | Submit with invalid email format | Validation error on email field |
| 25 | Submit with password < 6 chars | Validation error on password field |
| 26 | Submit with valid data | Account created, redirected to `/verify-email` |
| 27 | Check Firestore `users/{uid}` document | Document exists with `role: "customer"`, `name`, `email`, `createdAt` |

### 2.2 Customer Login
| Step | Action | Expected Result |
|------|--------|-----------------|
| 28 | Navigate to `/login` | Form visible: Email, Password fields |
| 29 | Submit wrong password | Error: "Sign in failed. Please try again." |
| 30 | Submit correct credentials | Redirect to `/customer/dashboard` |
| 31 | Check cookies | `firebase-auth-token` cookie exists, `httpOnly: true` |
| 32 | Refresh page | Still logged in, dashboard loads |

### 2.3 Email Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 33 | Login with unverified email | Redirect to `/verify-email` |
| 34 | Click "Send Verification Email" | Success message, email sent via Resend |
| 35 | Visit `/verify-email` after clicking link | Email verified, redirect to `/customer/dashboard` |

### 2.4 Password Reset
| Step | Action | Expected Result |
|------|--------|-----------------|
| 36 | Navigate to `/reset-password` | Email input form |
| 37 | Submit valid email | Success message (email sent) |
| 38 | Click reset link in email | Form to enter new password |
| 39 | Submit new password | Password updated, redirect to `/login` |
| 40 | Login with new password | Successful login |

### 2.5 Logout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 41 | Click logout button | `firebase-auth-token` cookie cleared |
| 42 | Try to access `/customer/dashboard` | Redirect to `/login` |
| 43 | Try to access `/vendor/dashboard` | Redirect to `/login` |

### 2.6 Session Security
| Step | Action | Expected Result |
|------|--------|-----------------|
| 44 | Open DevTools > Application > Cookies | No `localStorage` entries for user profiles |
| 45 | Check `firebase-auth-token` cookie flags | `httpOnly`, `secure` (in production), `sameSite: lax` |

---

## SECTION 3: CUSTOMER FEATURES

### 3.1 Customer Dashboard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 46 | Login as customer, visit `/customer/dashboard` | Dashboard loads with upcoming bookings, quick actions |
| 47 | Check real-time listener | Bookings list updates without page refresh |

### 3.2 Book a Ride
| Step | Action | Expected Result |
|------|--------|-----------------|
| 48 | Click "Book Ride" | Booking form opens with pickup/destination fields |
| 49 | Enter pickup location | Location suggestions appear |
| 50 | Enter destination | Location suggestions appear |
| 51 | Select date/time | DateTime picker works |
| 52 | Submit booking | Cloud Function `createRide` called, booking created in `bookingRequests` |
| 53 | Check `bookingRequests/{id}` | Document has `status: "searching"`, `customerId`, pickup/dest coords |
| 54 | Check `bookingRequestPrivate/{id}` | Document has customer phone and exact address |
| 55 | View ride tracking at `/customer/track/{bookingId}` | Map loads, status shows "Searching for driver..." |

### 3.3 Ride Tracking (Real-Time)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 56 | Driver accepts ride (from driver side) | Customer tracking page updates to "Driver found" |
| 57 | Driver status changes to "arriving" | Customer sees driver name, vehicle, ETA |
| 58 | Driver arrives | Customer sees "Driver has arrived" |
| 59 | Trip starts | Customer sees "Trip in progress" |
| 60 | Trip completes | Customer sees "Trip completed" modal with rating |

### 3.4 Fare Negotiation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 61 | Driver proposes fare during ride | Customer sees notification + negotiation modal |
| 62 | Customer accepts fare | Status updates to "accepted" |
| 63 | Customer counter-offers | Counter-offer sent to driver |
| 64 | Driver accepts counter | Ride proceeds |
| 65 | Customer declines offer | Ride cancelled or re-matched |

### 3.5 Trip Completion & Rating
| Step | Action | Expected Result |
|------|--------|-----------------|
| 66 | Trip completes, modal appears | Star rating (1-5), review text, tip option |
| 67 | Submit 5-star rating | Rating saved to `bookingRequests/{id}`, driver average recalculated |
| 68 | Submit review text | Text saved (max 500 chars) |
| 69 | Check driver's rating | Updated in `drivers/{id}` document |

### 3.6 Cancel Booking
| Step | Action | Expected Result |
|------|--------|-----------------|
| 70 | Open active booking | Cancel button visible |
| 71 | Click cancel, select reason | Cancellation reason recorded |
| 72 | Confirm cancellation | Booking status = "cancelled", driver notified |

### 3.7 Modify Booking
| Step | Action | Expected Result |
|------|--------|-----------------|
| 73 | Open pending booking | Modify button visible |
| 74 | Change pickup location | New location saved |
| 75 | Change date/time | New time saved |

### 3.8 Car Hire Request
| Step | Action | Expected Result |
|------|--------|-----------------|
| 76 | Navigate to `/hire` | Vehicle listings visible |
| 77 | Click a vehicle, fill hire form | Start date, end date, handover mode, driver mode |
| 78 | Submit hire request | Request created in `hireRequests` with status "pending" |
| 79 | Check `hireRequests/{id}` | Has `customerId`, `vehicleId`, `companyId`, pricing fields |

### 3.9 Hire Payment Submission
| Step | Action | Expected Result |
|------|--------|-----------------|
| 80 | Vendor approves request (see Section 5) | Customer sees invoice with line items |
| 81 | Customer submits M-Pesa payment proof | Payment created in `hirePayments` with status "pending" |
| 82 | Vendor confirms payment | Payment status = "confirmed", balance updated |

### 3.10 Customer Notifications
| Step | Action | Expected Result |
|------|--------|-----------------|
| 83 | Receive a booking notification | Bell icon badge increments |
| 84 | Click notification | Opens relevant page |
| 85 | Mark as read | Badge decrements |
| 86 | Mark all as read | All notifications marked read |

### 3.11 Customer Profile
| Step | Action | Expected Result |
|------|--------|-----------------|
| 87 | Visit `/customer/profile` | Profile data loaded (name, email, phone) |
| 88 | Update name | Name saved to Firestore |
| 89 | Update phone | Phone saved |

### 3.12 Report Issue
| Step | Action | Expected Result |
|------|--------|-----------------|
| 90 | Click "Report Issue" | Modal with category dropdown + description |
| 91 | Submit with description | Issue created in `issues` collection |
| 92 | Check admin Issues tab | Issue appears in admin panel |

---

## SECTION 4: DRIVER FEATURES

### 4.1 Driver Registration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 93 | Navigate to `/driver/register` | Multi-step registration form |
| 94 | Fill personal details (step 1) | Name, email, phone, password validated |
| 95 | Fill vehicle details (step 2) | Make, model, year, plate, type, seats |
| 96 | Upload vehicle photos (step 3) | Min 3 images, max 6, each < 5MB |
| 97 | Submit registration | Documents created: `users/{uid}`, `drivers/{id}`, `vehicles/{id}` |
| 98 | Check `drivers/{id}` | Has `status: "inactive"`, `subscriptionStatus`, `active: false` |

### 4.2 Driver Subscription
| Step | Action | Expected Result |
|------|--------|-----------------|
| 99 | Visit `/driver/dashboard` | Subscription status displayed |
| 100 | Click "Subscribe" | M-Pesa till number + instructions shown |
| 101 | Submit M-Pesa transaction code | Payment record created in `paymentVerifications` |
| 102 | Admin verifies payment (see Section 6) | `drivers/{id}` updated: `subscriptionStatus: "active"`, `active: true` |
| 103 | Driver becomes visible | Appears in driver carousel, bookable by customers |

### 4.3 Driver Dashboard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 104 | Login as driver, visit `/driver/dashboard` | Dashboard with ride requests, earnings, status toggle |
| 105 | Check real-time ride listener | New ride requests appear without refresh |
| 106 | Toggle online/offline | `drivers/{id}.active` toggles, affects matching visibility |

### 4.4 Accept Ride
| Step | Action | Expected Result |
|------|--------|-----------------|
| 107 | Receive ride request notification | Request shows pickup, destination, estimated fare |
| 108 | Accept ride | `bookingRequests/{id}.acceptedBy = driverId`, status = "accepted" |
| 109 | Driver status changes to "busy" | `drivers/{id}.status = "busy"` |
| 110 | Check customer tracking | Customer sees driver name, vehicle, ETA |

### 4.5 Ride Status Updates
| Step | Action | Expected Result |
|------|--------|-----------------|
| 111 | Mark "Arriving" | Customer notified: "Driver is on the way" |
| 112 | Mark "Arrived" | Customer notified: "Driver has arrived" |
| 113 | Mark "In Progress" | Trip starts, fare calculation active |
| 114 | Mark "Completed" | Trip ends, payment notification sent to customer |

### 4.6 Driver Location Tracking
| Step | Action | Expected Result |
|------|--------|-----------------|
| 115 | During active trip, check `bookingRequests/{id}` | `driverLocation` field updates every ~30 seconds |
| 116 | Check customer tracking page | Driver position moves on map |

### 4.7 Driver Pricing Manager
| Step | Action | Expected Result |
|------|--------|-----------------|
| 117 | Visit `/driver/pricing` | List of configured routes |
| 118 | Click "Add Route" | Modal: from, to, base price |
| 119 | Add a route | Route saved to `driverPricing/{driverId}` |
| 120 | Set modifiers (night, holiday, peak) | Modifiers saved and affect fare calculation |
| 121 | Delete a route | Route removed |

### 4.8 Driver History
| Step | Action | Expected Result |
|------|--------|-----------------|
| 122 | Visit `/driver/history` | List of completed/cancelled rides |
| 123 | Filter by date range | Results filtered correctly |
| 124 | Click a ride | Details: pickup, destination, fare, rating, customer |

### 4.9 Driver Notifications
| Step | Action | Expected Result |
|------|--------|-----------------|
| 125 | Visit `/driver/notifications` | List of driver notifications |
| 126 | Mark as read | Notification marked read, badge decrements |
| 127 | Mark all as read | All notifications marked read |

### 4.10 Driver Settings
| Step | Action | Expected Result |
|------|--------|-----------------|
| 128 | Visit `/driver/settings` | Profile, vehicle, M-Pesa details |
| 129 | Update profile photo | Photo uploaded to `taxi-drivers/`, URL saved |
| 130 | Update M-Pesa number | Phone saved |
| 131 | Update vehicle info | Vehicle document updated |

### 4.11 Marketing Poster
| Step | Action | Expected Result |
|------|--------|-----------------|
| 132 | Visit `/driver/marketing-poster` | SVG poster generated with driver info |
| 133 | Click "Download as PNG" | PNG file downloaded |
| 134 | Verify poster content | Shows driver name, phone, QR code, ratings |

---

## SECTION 5: VENDOR/COMPANY FEATURES

### 5.1 Company Onboarding
| Step | Action | Expected Result |
|------|--------|-----------------|
| 135 | Login as `car_hire`, visit `/vendor/dashboard` | Onboarding wizard if incomplete |
| 136 | Complete Step 1 (Company Info) | Name, email, phone, location |
| 137 | Complete Step 2 (Documents) | Upload business permit, insurance |
| 138 | Complete Step 3 (Yard Photos) | Upload yard images |
| 139 | Submit onboarding | `companies/{id}` created with `status: "pending"` |

### 5.2 Vendor Dashboard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 140 | Visit `/vendor/dashboard` | Fleet count, active rentals, MTD revenue, recent hires |
| 141 | Check real-time fleet listener | Vehicle count updates without refresh |
| 142 | Check partner alerts badge | Unread alert count shown |

### 5.3 Fleet Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 143 | Visit `/vendor/fleet` | Grid of vehicles with status badges |
| 144 | Click "Add Vehicle" | 3-step wizard opens |
| 145 | Step 1: Vehicle Details | Make, model, year, plate, type, seats, daily rate |
| 146 | Step 2: Upload Images | Min 3, max 6 images, each < 5MB |
| 147 | Step 3: Pricing & Features | Daily rate, security deposit, delivery fee |
| 148 | Submit | Vehicle created in `vehicles/{id}` with `companyId` |
| 149 | Click vehicle card | Navigate to `/vendor/fleet/{id}` |
| 150 | Update vehicle details | Changes saved |
| 151 | Toggle vehicle availability | Status changes between "active"/"maintenance" |

### 5.4 Vehicle Detail & Analytics
| Step | Action | Expected Result |
|------|--------|-----------------|
| 152 | Visit `/vendor/fleet/{id}` | Vehicle details, status, recent bookings |
| 153 | Visit `/vendor/fleet/{id}/analytics` | Total trips, revenue, utilization rate, rental history |

### 5.5 Hire Request Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 154 | Visit `/vendor/rentals/pending` | List of pending hire requests |
| 155 | Click a request | `HireRequestDetails` slide-over opens |
| 156 | Review customer KYC | If verified, shows name, phone, ID document link |
| 157 | Click "Approve & Send Invoice" | API call to `/api/vendor/hire-requests/approve` |
| 158 | Check `hireRequests/{id}` | Status = "approved", `prefilledInvoice` with line items |
| 159 | Check company stats | `companies/{id}.stats.activeRentals` incremented |
| 160 | Reject a request (different request) | API call to `/api/vendor/hire-requests/reject` |
| 161 | Check `hireRequests/{id}` | Status = "rejected", `rejectionReason` set |

### 5.6 Vehicle Inspection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 162 | Click "Initiate Handover Protocol" on approved request | `InspectionWizard` opens |
| 163 | Complete exterior checks | Checkboxes toggled |
| 164 | Complete interior checks | Checkboxes toggled |
| 165 | Complete mechanical checks | Checkboxes toggled |
| 166 | Add inspection notes | Text saved |
| 167 | Submit pre-release inspection | `hireRequests/{id}.preReleaseInspection` saved, status = "active" |
| 168 | Check vehicle status | `vehicles/{id}.status = "in_use"` |

### 5.7 Payment Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 169 | Visit `/vendor/rentals/payments` | List of hire payments |
| 170 | Click "Confirm" on pending payment | `HirePaymentModal` opens |
| 171 | Click "Confirm Payment" | API call to `/api/vendor/payments/confirm` |
| 172 | Check `hirePayments/{id}` | Status = "confirmed", `confirmedBy`, `confirmedAt` |
| 173 | Check audit log | `adminAuditEvents` has `confirm_payment` entry |
| 174 | Reject a payment | API call to `/api/vendor/payments/reject` |
| 175 | Check `hirePayments/{id}` | Status = "rejected", `rejectionReason` set |

### 5.8 Payment Auto-Revoke
| Step | Action | Expected Result |
|------|--------|-----------------|
| 176 | Confirm payment that makes hire fully paid | Overlapping unpaid bookings for same vehicle cancelled |
| 177 | Check overlapping `hireRequests/{id}` | Status = "cancelled", reason = "Vehicle booked and paid by another customer" |

### 5.9 Receipt Generation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 178 | After full payment, check `hireRequests/{id}` | `receipt` field present with `receiptNumber` format `TT-HR-YYYYMMDD-XXXX` |
| 179 | Verify receipt details | Vehicle name/plate, company name, customer name, line items, totals |

### 5.10 Staff Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 180 | Visit `/vendor/staff` | Staff list (empty initially) |
| 181 | Click "Invite Member" | Invitation link generated |
| 182 | Copy link | Link copied to clipboard |
| 183 | Open link in new tab | `/join?token={tokenId}` page loads |
| 184 | Complete onboarding form | Application submitted |
| 185 | Back in staff page, see pending application | Card shows candidate details |
| 186 | Click "Approve & Create Credentials" | Cloud Function `createStaffAccount` called |
| 187 | Check credentials modal | Email + temporary password displayed |
| 188 | Check `users/{tokenId}` | Document created with `role: "car_hire_staff"`, `companyId` |
| 189 | Toggle a permission on staff member | API call to `/api/vendor/staff/permissions` |
| 190 | Check `users/{staffId}.permissions` | Permission flag updated |

### 5.11 Vendor Finance
| Step | Action | Expected Result |
|------|--------|-----------------|
| 191 | Visit `/vendor/finance` | Payment history, totals, filters |
| 192 | Search by transaction ID | Results filtered |
| 193 | Search by customer name | Results filtered |
| 194 | Click "Export CSV" | CSV file downloaded with hire data |

### 5.12 Vendor Documents
| Step | Action | Expected Result |
|------|--------|-----------------|
| 195 | Visit `/vendor/documents` | Company documents list |
| 196 | Upload document | File uploaded to Firebase Storage, URL saved |
| 197 | Delete document | Document removed from list and Storage |

### 5.13 Vendor Notifications
| Step | Action | Expected Result |
|------|--------|-----------------|
| 198 | Visit `/vendor/notifications` | Partner alerts list |
| 199 | Click notification | Marked as read |
| 200 | Mark all as read | All notifications marked read |

### 5.14 Vendor Settings
| Step | Action | Expected Result |
|------|--------|-----------------|
| 201 | Visit `/vendor/settings/profile` | Company profile form |
| 202 | Update company name | Name saved |
| 203 | Upload company logo | Logo uploaded, displayed |
| 204 | Visit `/vendor/settings/company-rules` | Fee configuration, inspection templates |
| 205 | Update delivery fee | Fee saved to `companies/{id}` |
| 206 | Update inspection template | Template saved |

### 5.15 Vendor Performance
| Step | Action | Expected Result |
|------|--------|-----------------|
| 207 | Visit `/vendor/performance` | Fleet performance metrics |
| 208 | View vehicle stats | Trips, revenue, utilization per vehicle |
| 209 | View driver stats | Rating, trips, earnings per driver |

---

## SECTION 6: ADMIN FEATURES

### 6.1 Admin Dashboard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 210 | Login as admin, visit `/admin/dashboard` | Stats: users, drivers, bookings, revenue |
| 211 | Check Cloud Function `getAdminStats` | Aggregated data returned |

### 6.2 User Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 212 | Visit `/admin/users` | List of all users with roles |
| 213 | Search by name | Results filtered |
| 214 | Click user | User detail modal opens |
| 215 | Suspend user | `users/{uid}.suspended = true` |
| 216 | Try logging in as suspended user | Error: "Your account has been suspended" |
| 217 | Unsuspend user | `users/{uid}.suspended = false` |

### 6.3 Driver Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 218 | Visit `/admin/drivers` | List of all drivers |
| 219 | Search by name prefix | Results filtered (Firestore prefix query) |
| 220 | Filter by status | Results filtered |
| 221 | Click driver | Detail modal with KYC, subscription, ride history |
| 222 | Manually activate subscription | `drivers/{id}.subscriptionStatus = "active"` |
| 223 | Deactivate driver | `drivers/{id}.active = false` |

### 6.4 KYC Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 224 | Visit `/admin/kyc` | Pending KYC submissions |
| 225 | View driver KYC documents | ID, license, PSV badge visible |
| 226 | Approve KYC | `drivers/{id}.kycStatus = "approved"`, notification sent |
| 227 | Reject KYC with reason | `drivers/{id}.kycStatus = "rejected"`, email notification sent |

### 6.5 Payment Verification
| Step | Action | Expected Result |
|------|--------|-----------------|
| 228 | Visit `/admin/payments` | Pending payment verifications |
| 229 | Click "Verify" on payment | `admin-service.ts: verifyDriverPayment` called |
| 230 | Check `drivers/{id}` | `subscriptionStatus = "active"`, `subscriptionStartDate` set |
| 231 | Click "Reject" on payment | `admin-service.ts: rejectDriverPayment` called |
| 232 | Check `paymentVerifications/{id}` | Status = "rejected" |

### 6.6 Company Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 233 | Visit `/admin/companies` | List of all companies |
| 234 | Search by name | Results filtered |
| 235 | Click company | Review modal opens |
| 236 | Approve company | `companies/{id}.status = "approved"` |
| 237 | Suspend company | `companies/{id}.status = "suspended"` |
| 238 | Grant corporate status | `companies/{id}.corporate = true` |
| 239 | Purge company (Cloud Function) | Company + all associated data deleted |

### 6.7 Booking Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 240 | Visit admin bookings tab | List of all bookings |
| 241 | Filter by status | Results filtered |
| 242 | Delete booking | Booking removed from Firestore |

### 6.8 Support/Issues
| Step | Action | Expected Result |
|------|--------|-----------------|
| 243 | Visit admin issues tab | List of support issues |
| 244 | Click issue | Issue details + reply form |
| 245 | Reply to issue | Reply saved to `issues/{id}/replies` subcollection |
| 246 | Change issue status | Status updated |

### 6.9 Crash Reports
| Step | Action | Expected Result |
|------|--------|-----------------|
| 247 | Visit `/admin/crashes` | List of crash reports |
| 248 | Search by message | Results filtered |
| 249 | Mark as resolved | `app_crashes/{id}.resolved = true` |

### 6.10 Share Links
| Step | Action | Expected Result |
|------|--------|-----------------|
| 250 | Visit `/admin/share-links` | List of ride share links |
| 251 | Toggle link active/inactive | `shareLinks/{id}.active` toggled |
| 252 | Delete link | Link removed |

### 6.11 Audit Logs
| Step | Action | Expected Result |
|------|--------|-----------------|
| 253 | Visit `/admin/audit-logs` | List of audit events |
| 254 | Check entries | Shows user, action, resource, timestamp, IP |
| 255 | Verify payment confirmation logged | Entry shows `confirm_payment`, `hirePayments`, payment ID |

### 6.12 Admin Settings
| Step | Action | Expected Result |
|------|--------|-----------------|
| 256 | Visit `/admin/settings` | Platform settings form |
| 257 | Toggle kill switch | `system/config.operational` toggled |
| 258 | Test kill switch | All Cloud Functions reject with "System is temporarily down" |

### 6.13 Email Sending
| Step | Action | Expected Result |
|------|--------|-----------------|
| 259 | Trigger email from admin panel | POST to `/api/send-email` |
| 260 | Check email sent | Email received by recipient |
| 261 | Try sending with invalid data | Returns `{ error: "Validation failed" }` |
| 262 | Try sending 6 emails rapidly | 6th returns 429 (rate limited) |

### 6.14 Admin Analytics
| Step | Action | Expected Result |
|------|--------|-----------------|
| 263 | Visit `/admin/analytics` | Charts: users, bookings, revenue over time |
| 264 | Check data matches actual Firestore counts | Numbers consistent |

---

## SECTION 7: CROSS-CUTTING CONCERNS

### 7.1 Real-Time Data Consistency
| Step | Action | Expected Result |
|------|--------|-----------------|
| 265 | Open vendor fleet page in Tab A | Vehicle list loads |
| 266 | Add vehicle in Tab B | Tab A updates automatically (onSnapshot) |
| 267 | Open admin drivers page in Tab A | Driver list loads |
| 268 | Suspend driver in Tab B | Tab A updates, driver disappears from active list |

### 7.2 Role-Based Access Control
| Step | Action | Expected Result |
|------|--------|-----------------|
| 269 | Customer tries `/vendor/dashboard` | Redirect to `/login` |
| 270 | Customer tries `/admin/dashboard` | Redirect to `/login` |
| 271 | Driver tries `/vendor/dashboard` | Redirect to `/login` |
| 272 | Vendor staff tries `/admin/dashboard` | Redirect to `/login` |
| 273 | Vendor staff with `manageFleet: false` visits `/vendor/fleet` | Page loads but add/edit disabled |
| 274 | Vendor staff with `viewFinance: false` visits `/vendor/finance` | Access denied or hidden |

### 7.3 Error Handling
| Step | Action | Expected Result |
|------|--------|-----------------|
| 275 | Disconnect network, submit form | Error message shown, no crash |
| 276 | Submit form with network timeout | Retry option shown |
| 277 | Trigger Cloud Function error | Generic error message (no internal details leaked) |
| 278 | Check browser console | No stack traces or internal paths exposed to user |

### 7.4 Mobile Responsiveness
| Step | Action | Expected Result |
|------|--------|-----------------|
| 279 | Open `/login` on mobile viewport (375px) | Form readable, inputs tappable (min 44px) |
| 280 | Open vendor dashboard on tablet (768px) | Grid layout adapts |
| 281 | Open admin panel on mobile | Navigation collapses, content accessible |
| 282 | Open booking form on mobile | Full-screen form, map visible |

### 7.5 PWA Features
| Step | Action | Expected Result |
|------|--------|-----------------|
| 283 | Visit site on mobile | "Add to Home Screen" prompt (or banner on iOS) |
| 284 | Install PWA | App icon on home screen |
| 285 | Open PWA | Splash screen, standalone mode |
| 286 | Go offline | Cached content available, graceful degradation |

### 7.6 Performance
| Step | Action | Expected Result |
|------|--------|-----------------|
| 287 | Lighthouse audit on home page | Performance score > 80 |
| 288 | Lighthouse audit on customer dashboard | Performance score > 70 |
| 289 | Check First Contentful Paint | < 2s on 3G |
| 290 | Check Largest Contentful Paint | < 4s on 3G |
| 291 | Check bundle size | < 200KB gzipped |

---

## SECTION 8: API ENDPOINT TESTS

### 8.1 POST /api/auth/session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 292 | Valid Firebase ID token | 200, `firebase-auth-token` cookie set |
| 293 | Missing body | 400 `{ error: "Validation failed" }` |
| 294 | Empty `idToken` | 400 `{ error: "Validation failed" }` |
| 295 | Expired/invalid token | 401 `{ error: "Invalid token" }` |
| 296 | 6 rapid requests | 429 (rate limited) |

### 8.2 POST /api/auth/logout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 297 | Any request | 200, `firebase-auth-token` cookie cleared |

### 8.3 POST /api/vendor/payments/confirm
| Step | Action | Expected Result |
|------|--------|-----------------|
| 298 | Valid payment + auth | 200, payment confirmed |
| 299 | Unauthenticated | 401 |
| 300 | Wrong company ownership | 403 |
| 301 | Already confirmed payment | 409 |
| 302 | Non-existent payment | 404 |
| 303 | Missing `paymentId` | 400 |

### 8.4 POST /api/vendor/payments/reject
| Step | Action | Expected Result |
|------|--------|-----------------|
| 304 | Valid payment + reason + auth | 200, payment rejected |
| 305 | Unauthenticated | 401 |
| 306 | Missing `reason` | 400 |

### 8.5 POST /api/vendor/hire-requests/approve
| Step | Action | Expected Result |
|------|--------|-----------------|
| 307 | Valid request + auth | 200, request approved, invoice generated |
| 308 | Unauthenticated | 401 |
| 309 | Non-pending request | 409 |
| 310 | Non-existent request | 404 |

### 8.6 POST /api/vendor/hire-requests/reject
| Step | Action | Expected Result |
|------|--------|-----------------|
| 311 | Valid request + reason + auth | 200, request rejected |
| 312 | Unauthenticated | 401 |
| 313 | Missing `reason` | 400 |

### 8.7 POST /api/vendor/staff/permissions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 314 | Valid staff + permissions + auth | 200, permissions updated |
| 315 | Unauthenticated | 401 |
| 316 | Non-existent staff | 404 |
| 317 | Target is not staff member | 400 |

### 8.8 POST /api/send-email
| Step | Action | Expected Result |
|------|--------|-----------------|
| 318 | Admin + valid data | 200, email sent |
| 319 | Non-admin | 403 |
| 320 | Invalid email format | 400 |
| 321 | Missing `html` | 400 |
| 322 | 6 rapid requests | 429 |

### 8.9 GET /api/vendor/reports
| Step | Action | Expected Result |
|------|--------|-----------------|
| 323 | Authenticated + company | 200, CSV file returned |
| 324 | Unauthenticated | 401 |

---

## SECTION 9: EDGE CASES & NEGATIVE TESTING

### 9.1 Concurrent Operations
| Step | Action | Expected Result |
|------|--------|-----------------|
| 325 | Two vendors confirm same payment simultaneously | Only first succeeds, second gets error |
| 326 | Customer cancels ride while driver accepts | Ride status consistent (cancelled or accepted, not both) |
| 327 | Two admins suspend same user | User suspended (idempotent) |

### 9.2 Data Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 328 | Submit booking with past date | Rejected |
| 329 | Submit hire request with end < start | Rejected |
| 330 | Submit booking with 1000-char notes | Truncated or rejected (max length enforced) |
| 331 | Upload 10MB image | Rejected (5MB limit) |
| 332 | Upload `.exe` file | Rejected (type validation) |

### 9.3 State Machine Integrity
| Step | Action | Expected Result |
|------|--------|-----------------|
| 333 | Try to complete a "searching" ride directly | Rejected (must go through accepted -> arrived -> in_progress) |
| 334 | Try to approve an already approved request | 409 Conflict |
| 335 | Try to confirm an already confirmed payment | 409 Conflict |

### 9.4 XSS Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 336 | Enter `<script>alert(1)</script>` in booking notes | Rendered as text, not executed |
| 337 | Enter `<img onerror="alert(1)">` in profile name | Sanitized or rejected |
| 338 | Enter `javascript:alert(1)` in URL field | Rejected by URL validation |

### 9.5 Open Redirect Prevention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 339 | Visit `/login?returnTo=https://evil.com` | After login, redirect to `/` (not evil.com) |
| 340 | Visit `/login?returnTo=/admin/dashboard` | After login, redirect to `/admin/dashboard` (relative path OK) |

### 9.6 Authorization Bypass Attempts
| Step | Action | Expected Result |
|------|--------|-----------------|
| 341 | Customer calls `/api/vendor/payments/confirm` | 401 (not authenticated as vendor) |
| 342 | Vendor A confirms Vendor B's payment | 403 (wrong company) |
| 343 | Staff with `manageFleet: false` adds vehicle | Rejected by Firestore rules or API |
| 344 | Customer tries to update admin user | 401/403 |

---

## SECTION 10: FIRESTORE RULES TESTING

| Step | Action | Expected Result |
|------|--------|-----------------|
| 345 | Unauthenticated read on `users/{any}` | Denied |
| 346 | User reads own `users/{uid}` | Allowed |
| 347 | User reads other user's profile | Denied (unless admin/assistant) |
| 348 | Admin reads any `users/{uid}` | Allowed |
| 349 | Unauthenticated read on `vehicles/{id}` | Allowed (public) |
| 350 | Vendor creates vehicle with own `companyId` | Allowed |
| 351 | Vendor creates vehicle with wrong `companyId` | Denied |
| 352 | Unauthenticated read on `bookingRequests/{id}` | Denied |
| 353 | Customer reads own booking | Allowed |
| 354 | Driver reads booking they're assigned to | Allowed |
| 355 | Customer creates booking (via Cloud Function) | Allowed |
| 356 | Direct client write to `hirePayments` | Denied (`allow write: if false`) |
| 357 | Admin writes to `hirePayments` (via Admin SDK) | Allowed (bypasses rules) |
| 358 | Unauthenticated read on `adminAuditEvents` | Denied |
| 359 | Admin reads `adminAuditEvents` | Allowed |
| 360 | Unauthenticated read on `notifications/{id}` | Denied |
| 361 | User reads own notification | Allowed |
| 362 | User reads other user's notification | Denied |

---

## SECTION 11: EMAIL DELIVERY

| Step | Action | Expected Result |
|------|--------|-----------------|
| 363 | Trigger payment verification email | Email received with branded template |
| 364 | Trigger password reset email | Email received with reset link |
| 365 | Trigger verification email | Email received with verification link |
| 366 | Trigger staff credentials email | Email received with temp password |
| 367 | Trigger subscription expiring email | Email received with renewal instructions |

---

## SECTION 16: COMPLETE FLOW INTEGRATION TESTS

### 16.1 End-to-End Ride Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 368 | Customer signs up, verifies email, books ride | Booking created, status "searching" |
| 369 | Driver subscribes, goes online, accepts ride | Matched, status "accepted" |
| 370 | Driver arrives, starts trip, completes trip | Status progresses correctly |
| 371 | Customer rates 5 stars | Rating saved, driver avg updated |
| 372 | Check all notifications sent | Customer + driver notified at each stage |
| 373 | Check audit trail | All mutations logged |

### 16.2 End-to-End Car Hire Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 374 | Customer browses `/hire`, selects vehicle | Hire request form loads |
| 375 | Customer submits hire request | Request created, company notified |
| 376 | Vendor approves, generates invoice | Invoice with line items visible to customer |
| 377 | Customer submits M-Pesa payment | Payment record created |
| 378 | Vendor confirms payment | Payment confirmed, balance updated |
| 379 | Vendor does pre-release inspection | Vehicle status = "in_use", hire = "active" |
| 380 | Rental period ends, post-return inspection | Vehicle released, hire = "completed" |
| 381 | Receipt generated | Full receipt with all details |

### 16.3 End-to-End Staff Onboarding Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 382 | Vendor invites staff via link | Invitation link generated |
| 383 | Staff member opens link, fills form | Application submitted |
| 384 | Vendor approves, credentials generated | Cloud Function creates Auth user |
| 385 | Staff logs in with temp password | Access to vendor portal |
| 386 | Vendor toggles permissions | Permissions enforced on next page load |

---

## TEST EXECUTION CHECKLIST

- [ ] Section 1: Infrastructure & Security (Steps 1-21)
- [ ] Section 2: Authentication (Steps 22-45)
- [ ] Section 3: Customer Features (Steps 46-92)
- [ ] Section 4: Driver Features (Steps 93-134)
- [ ] Section 5: Vendor Features (Steps 135-209)
- [ ] Section 6: Admin Features (Steps 210-264)
- [ ] Section 7: Cross-Cutting Concerns (Steps 265-291)
- [ ] Section 8: API Endpoint Tests (Steps 292-324)
- [ ] Section 9: Edge Cases (Steps 325-344)
- [ ] Section 10: Firestore Rules (Steps 345-362)
- [ ] Section 11: Email Delivery (Steps 363-367)
- [ ] Section 16: Integration Tests (Steps 368-386)

**Total: 386 test steps**
