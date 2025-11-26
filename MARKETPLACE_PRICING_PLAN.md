# Dynamic Pricing & Negotiation System - Implementation Plan

## 🎯 Vision Summary

Transform TaxiTao from a simple booking system into a **marketplace platform** where:
- Drivers set custom prices per location/service
- Customers negotiate prices in real-time
- Smart algorithms match customers with best-value drivers
- Full business analytics for drivers

---

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CUSTOMER FLOW                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Search for ride                                          │
│ 2. System shows 3 recommended drivers:                      │
│    - Best Value  - Lowest Price  - Best Rated              │
│ 3. Customer can:                                            │
│    - Accept driver's price                                  │
│    - Send offer/counter-offer                               │
│    - Request discount                                       │
│ 4. Negotiation exchange (real-time)                        │
│ 5. Accept final price & book                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     DRIVER FLOW                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Set up custom price list                                │
│ 2. Configure auto-accept rules                             │
│ 3. Receive booking requests with:                          │
│    - Customer offer (if any)                                │
│    - System-recommended price                               │
│ 4. Accept / Decline / Counter-offer                        │
│ 5. Complete ride & view earnings                           │
│ 6. Access business analytics                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Design

### 1. DriverPricing Collection

```typescript
interface DriverPricing {
  id: string;
  driverId: string;
  
  // Route-based pricing (specific major routes)
  routePricing: {
    [route: string]: {
      price: number; // e.g., "Machakos-Masii": 3000 KES
    };
  };
  
  // Special zone pricing
  specialZones: {
    [zoneName: string]: {
      type: 'airport' | 'city_center' | 'estate' | 'other';
      surchargePercent: number;   // e.g., 20% extra
      flatSurcharge?: number;      // Or flat fee: 500 KES
    }
  };
  
  // Service packages
  packages: {
    hourlyHire: {
      halfDay: number;            // e.g., 3000 KES (4 hours)
      fullDay: number;            // e.g., 5000 KES (8 hours)
      perHour: number;            // e.g., 800 KES/hr
    };
    longDistance: {
      [route: string]: number;    // e.g., "Machakos-Mombasa": 8000
    };
    specialServices: {
      wedding: number;
      corporate: number;
      airport: number;
    };
  };
  
  // Dynamic pricing modifiers
  modifiers: {
    nightShift: {
      enabled: boolean;
      startTime: string;          // "20:00"
      endTime: string;            // "06:00"
      multiplier: number;         // 1.5x
    };
    holiday: {
      enabled: boolean;
      multiplier: number;         // 2.0x
    };
    peakHours: {
      enabled: boolean;
      timeSlots: Array<{
        start: string;
        end: string;
        multiplier: number;
      }>;
    };
  };
  
  // Auto-accept rules
  autoAcceptRules: {
    enabled: boolean;
    minimumPrice: number;         // Won't accept below this
    autoAcceptAbove: number;      // Auto-accept if offer above this
    autoDeclineBelow: number;     // Auto-decline if below this
  };
  
  // Visibility settings
  visibility: {
    showPriceList: boolean;       // Show to all customers?
    showOnlyRecommended: boolean; // Only show to algorithm-matched customers?
    hideFromCompetitors: boolean; // Hide from other drivers?
  };
  
  lastUpdated: Timestamp;
}
```

---

### 2. NegotiationThread Collection

```typescript
interface NegotiationThread {
  id: string;
  bookingRequestId: string;     // Links to booking
  customerId?: string;           // Optional if guest
  customerName: string;
  customerPhone: string;
  driverId: string;
  
  // Negotiation details
  initialPrice: number;          // Driver's initial quote
  currentOffer: number;          // Current negotiation price
  status: 'active' | 'accepted' | 'declined' | 'expired';
  
  // Message thread
  messages: Array<{
    sender: 'customer' | 'driver' | 'system';
    type: 'offer' | 'counter' | 'accept' | 'decline' | 'message';
    price?: number;
    message?: string;
    timestamp: Timestamp;
    discount?: {
      percent: number;
      amount: number;
    };
  }>;
  
  // Metadata
  createdAt: Timestamp;
  expiresAt: Timestamp;          // Negotiations expire after 15 minutes
  finalPrice?: number;
  acceptedAt?: Timestamp;
}
```

---

### 3. DriverEarnings Collection

```typescript
interface DriverEarnings {
  id: string;
  driverId: string;
  month: string;                 // "2025-11"
  
  // Revenue tracking
  totalRevenue: number;
  dailyEarnings: {
    [date: string]: number;      // "2025-11-25": 3500
  };
  
  // Ride statistics
  ridesCompleted: number;
  ridesCancelled: number;
  negotiatedRides: number;       // Rides with price negotiation
  normalRides: number;           // Rides at standard price
  
  // Negotiation analytics
  negotiationStats: {
    totalNegotiations: number;
    acceptedOffers: number;
    declinedOffers: number;
    averageDiscount: number;     // Average % discount given
    totalDiscountLoss: number;   // Total KES lost to discounts
  };
  
  // Additional income
  tips: {
    total: number;
    count: number;
    average: number;
  };
  
  carHire: {
    total: number;
    count: number;
  };
  
  // Commission tracking
  commission: {
    platformFee: number;         // Total paid to platform
    driverEarnings: number;      // Net earnings
    rate: number;                // Commission rate (e.g., 0.15)
  };
  
  // Performance metrics
  performance: {
    bestLocation: string;
    topClients: string[];
    hoursWorked: number;
    weeklyBookings: {
      [weekNumber: number]: number;
    };
  };
  
  // Growth tracking
  growth: {
    monthOverMonth: number;      // % growth vs last month
    yearOverYear: number;
  };
}
```

---

### 4. PriceRecommendation Collection (Cached)

```typescript
interface PriceRecommendation {
  id: string;
  customerId?: string;
  customerLocation: string;
  destination: string;
  timestamp: Timestamp;
  
  // Algorithm results
  recommendations: Array<{
    driverId: string;
    driverName: string;
    category: 'best_value' | 'lowest_price' | 'best_rated';
    score: number;              // Algorithm score (0-100)
    
    pricing: {
      basePrice: number;
      estimatedTotal: number;
      breakdown: {
        baseFare: number;
        distance: number;
        time: number;
        surcharges: number;
      };
    };
    
    driverStats: {
      rating: number;
      completedRides: number;
      responseTime: string;     // "< 5 min"
    };
    
    // Why recommended?
    reasons: string[];          // ["Best price in area", "Highly rated", etc.]
  }>;
  
  expiresAt: Timestamp;         // Cache expires after 5 minutes
}
```

---

## 🎨 UI/UX Flow Design

### Customer Journey

#### 1. Booking Request Page
```tsx
┌────────────────────────────────────────────┐
│  📍 Pickup Location: [Machakos      ▼]    │
│  🎯 Destination:     [Nairobi CBD   ▼]    │
│  📅 Date: [Tomorrow ▼]  Time: [10:00 ▼]  │
│                                            │
│  [Find Drivers] ────────────────────────  │
└────────────────────────────────────────────┘

↓ System shows 3 recommendations:

┌────────────────────────────────────────────┐
│  🏆 BEST VALUE                             │
│  ─────────────────────────────────────────│
│  Benjamin Mutua  ⭐ 5.0 (124 rides)      │
│  KES 1,200  💰  •  15 min away            │
│  Best price-to-quality ratio              │
│  [Accept Price] [Make Offer]              │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  💸 LOWEST PRICE                           │
│  ─────────────────────────────────────────│
│  Faith Wanja  ⭐ 5.0 (87 rides)          │
│  KES 1,000  💰  •  20 min away            │
│  Cheapest available driver                │
│  [Accept Price] [Make Offer]              │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  ⭐ BEST RATED                             │
│  ─────────────────────────────────────────│
│  John Doe  ⭐ 5.0 (312 rides)            │
│  KES 1,500  💰  •  10 min away            │
│  Top-rated professional driver             │
│  [Accept Price] [Make Offer]              │
└────────────────────────────────────────────┘
```

#### 2. Negotiation Interface
```tsx
┌────────────────────────────────────────────┐
│  💬 Negotiate with Benjamin Mutua          │
│  ─────────────────────────────────────────│
│  Original Price: KES 1,200                 │
│                                            │
│  Your Offer:  [1,000     ] KES            │
│               └─ 17% discount              │
│                                            │
│  Message (optional):                       │
│  [I'm a regular customer, can you...]     │
│                                            │
│  [Send Offer] ─────────────────────────  │
│                                            │
│  💡 Tip: Average accepted discount is 10%  │
└────────────────────────────────────────────┘

↓ Driver receives notification

┌────────────────────────────────────────────┐
│  🔔 New Offer from Customer                │
│  ─────────────────────────────────────────│
│  Your Price: KES 1,200                     │
│  Offer:      KES 1,000  (-17%)            │
│                                            │
│  Message: "I'm a regular customer..."      │
│                                            │
│  [Accept] [Counter-Offer] [Decline]       │
│                                            │
│  Auto-Accept: ✅ (above KES 950 minimum)  │
└────────────────────────────────────────────┘
```

---

### Driver Dashboard Enhancements

#### 1. Pricing Management Tab
```tsx
┌────────────────────────────────────────────┐
│  └─ Estates:       +10% [ ]               │
│                                            │
│  🕐 Dynamic Pricing                       │
│  ├─ Night (8PM-6AM):    1.5x [✓]         │
│  ├─ Peak Hours:         1.3x [✓]         │
│  └─ Holidays:           2.0x [✓]         │
│                                            │
│  [Save Pricing] ──────────────────────── │
└────────────────────────────────────────────┘
```

#### 2. Negotiation Settings
```tsx
┌────────────────────────────────────────────┐
│  ⚙️ AUTO-ACCEPT RULES                      │
│  ─────────────────────────────────────────│
│                                            │
│  Minimum Price:      [950      ] KES      │
│  ↳ Auto-decline below this                 │
│                                            │
│  Auto-Accept Above:  [1,100    ] KES      │
│  ↳ Instantly accept without review         │
│                                            │
│  Max Discount:       [15       ] %        │
│  ↳ Don't accept offers with bigger discount│
│                                            │
│  [✓] Notify me of all offers               │
│  [ ] Auto-decline during off hours         │
│                                            │
│  [Save Settings] ─────────────────────── │
└────────────────────────────────────────────┘
```

#### 3. Business Analytics Dashboard
```tsx
┌────────────────────────────────────────────┐
│  📊 NOVEMBER 2025 EARNINGS                 │
│  ─────────────────────────────────────────│
│                                            │
│  Monthly Revenue:     KES 125,300  ↗      │
│  Growth vs Oct:       +12%                 │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │      Earnings Chart (Line Graph)     │ │
│  │  KES                                  │ │
│  │  5K ┤     ╭─╮                        │ │
│  │  4K ┤  ╭──╯ ╰─╮  ╭─╮                │ │
│  │  3K ┤╭─╯       ╰──╯ ╰──╮            │ │
│  │  2K ┼────────────────────────>      │ │
│  │     │ M  T  W  T  F  S  S           │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Ride Statistics:                          │
│  ├─ Completed:      87 rides               │
│  ├─ Cancelled:      5 rides                │
│  ├─ Negotiated:     42 rides (48%)        │
│  └─ Standard Price: 45 rides (52%)        │
│                                            │
│  Negotiation Performance:                  │
│  ├─ Avg Discount:   12%                    │
│  ├─ Total Loss:     KES 8,420              │
│  └─ Success Rate:   82%                    │
│                                            │
│  💡 Best Performing:                      │
│  ├─ Location:       Machakos → Nairobi    │
│  ├─ Time Slot:      6AM - 9AM             │
│  └─ Service:        Airport transfers      │
│                                            │
│  [View Detailed Report] ──────────────── │
└────────────────────────────────────────────┘
```

---

## 🧠 Smart Matching Algorithm

### Algorithm Logic

```typescript
interface MatchingFactors {
  // Customer preferences
  customerPriority: 'price' | 'rating' | 'speed' | 'value';
  maxBudget?: number;
  
  // Driver attributes
  driverPrice: number;
  driverRating: number;
  driverResponseTime: number;
  driverDistance: number;
  driverCompletedRides: number;
  
  // Market context
  averageMarketPrice: number;
  currentDemand: 'low' | 'medium' | 'high';
  timeOfDay: string;
}

function calculateMatchScore(driver: Driver, factors: MatchingFactors): number {
  let score = 0;
  
  // Price factor (40% weight)
  const priceRatio = factors.averageMarketPrice / driver.price;
  score += (priceRatio * 40);
  
  // Rating factor (30% weight)
  score += (driver.rating / 5) * 30;
  
  // Speed factor (20% weight)
  const speedScore = Math.max(0, 100 - (driver.distance * 2));
  score += (speedScore / 100) * 20;
  
  // Experience factor (10% weight)
  const expScore = Math.min(100, driver.completedRides / 10);
  score += (expScore / 100) * 10;
  
  return Math.round(score);
}

function categorizeDrivers(drivers: Driver[]): {
  bestValue: Driver;
  lowestPrice: Driver;
  bestRated: Driver;
} {
  // Sort by different criteria
  const byValue = drivers.sort((a, b) => calculateMatchScore(b, factors) - calculateMatchScore(a, factors));
  const byPrice = drivers.sort((a, b) => a.price - b.price);
  const byRating = drivers.sort((a, b) => b.rating - a.rating);
  
  return {
    bestValue: byValue[0],
    lowestPrice: byPrice[0],
    bestRated: byRating[0]
  };
}
```

---

## 📅 Implementation Phases

### **Phase 1: Foundation** (Week 1-2)

**Goal:** Basic pricing infrastructure

**Tasks:**
1. ✅ Create database schema
   - DriverPricing collection
   - Update BookingRequest with pricing fields
   
2. ✅ Driver pricing UI
   - Location-based pricing form
   - Special zone configuration
   - Save/update pricing

3. ✅ Basic price calculation
   - Calculate fare based on driver's settings
   - Apply surcharges (night, holiday, zones)
   
4. ✅ Show prices to customers
   - Display driver prices on booking page
   - Simple accept/decline flow

**Deliverable:** Drivers can set prices, customers can see them

---

### **Phase 2: Negotiation System** (Week 3-4)

**Goal:** Enable offer/counter-offer

**Tasks:**
1. ✅ Create NegotiationThread collection
2. ✅ Negotiation UI for customers
   - Make offer interface
   - Send counter-offer
   - View negotiation history
   
3. ✅ Negotiation UI for drivers
   - Accept/Decline offers
   - Send counter-offers
   - Auto-accept rules configuration
   
4. ✅ Real-time updates
   - Use Firebase listeners
   - Instant notification of offers
   - Update pricing in real-time

**Deliverable:** Full negotiation capability

---

### **Phase 3: Smart Matching** (Week 5-6)

**Goal:** Algorithm-driven recommendations

**Tasks:**
1. ✅ Implement matching algorithm
   - Calculate match scores
   - Categorize drivers (value/price/rating)
   
2. ✅ Price recommendation cache
   - Store algorithm results
   - Expire after 5 minutes
   
3. ✅ UI for recommendations
   - 3-card layout (best value, lowest, best rated)
   - Highlight why each is recommended
   
4. ✅ A/B testing framework
   - Test algorithm variations
   - Optimize weights

**Deliverable:** Smart driver recommendations

---

### **Phase 4: Analytics & Business Intelligence** (Week 7-8)

**Goal:** Driver earnings dashboard

**Tasks:**
1. ✅ DriverEarnings collection
   - Daily/monthly tracking
   - Negotiation analytics
   
2. ✅ Analytics dashboard UI
   - Revenue charts
   - Performance metrics
   - Best locations/times
   
3. ✅ Reports generation
   - Monthly summary
   - Tax reports
   - Commission statements
   
4. ✅ Insights & recommendations
   - "Increase prices on Friday nights"
   - "Airport runs are most profitable"

**Deliverable:** Full business analytics

---

### **Phase 5: Advanced Features** (Week 9-12)

**Goal:** Premium marketplace features

**Tasks:**
1. ✅ Package pricing (driver sets own prices)
   - Hourly hire (driver defines price per hour)
   - Long‑distance packages (driver defines price per route)
   - Special events (driver defines custom price)
   
2. ✅ Dynamic market pricing
   - Surge pricing during peak demand
   - Competitive analysis
   - Price suggestions
   
3. ✅ Customer loyalty
   - Repeat customer discounts
   - Referral bonuses
   - VIP customer tiers
   
4. ✅ Commission system
   - Platform fee calculation
   - Driver payout automation
   - Financial reporting

**Deliverable:** Full-featured marketplace

---

## 🛠️ Technical Stack

### Backend Services

```typescript
// New services needed:

1. pricing-service.ts
   - calculateFare(driver, route, modifiers)
   - getDriverPricing(driverId, location)  
   - updatePricing(driverId, newPricing)

2. negotiation-service.ts
   - createOffer(customerId, driverId, price)
   - acceptOffer(negotiationId)
   - counterOffer(negotiationId, newPrice)
   - autoAcceptCheck(offer, driverRules)

3. matching-service.ts
   - findMatchingDrivers(location, destination)
   - calculateMatchScores(drivers, factors)
   - categorizeRecommendations(drivers)
   - getCachedRecommendations(location)

4. analytics-service.ts
   - trackEarnings(driverId, amount, metadata)
   - getMonthlyStats(driverId, month)
   - calculateGrowth(driverId)
   - generateReport(driverId, period)
```

### Real-time Features

```typescript
// Firebase listeners for real-time negotiation:

// Customer side
onSnapshot(negotiationRef, (snapshot) => {
  const thread = snapshot.data();
  // Show driver's counter-offer in real-time
  updateNegotiationUI(thread);
});

// Driver side
onSnapshot(negotiationsRef, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      // New offer notification
      showNewOfferNotification(change.doc.data());
    }
  });
});
```

---

## 💡 Key Design Decisions

### 1. Pricing Visibility
**Decision:** Private by default, visible only to matched customers

**Rationale:**
- Prevents price wars between drivers
- Customers see "recommended" prices, not all prices
- Protects driver's competitive advantage

### 2. Negotiation Expiry
**Decision:** 15-minute timeout

**Rationale:**
- Creates urgency
- Prevents stale offers
- Keeps marketplace dynamic

### 3. Auto-Accept Rules
**Decision:** Optional but recommended

**Rationale:**
- Saves driver time
- Faster booking conversion
- Drivers set their own minimums

### 4. Commission Structure
**Decision:** 15% platform fee on completed rides

**Rationale:**
- Industry standard
- Covers operational costs
- Fair to drivers (85% take-home)

---

## 🎯 Success Metrics

### Driver Metrics
- Average monthly earnings
- Negotiation success rate
- Price acceptance rate
- Customer satisfaction

### Customer Metrics
- Time to booking
- Price satisfaction
- Repeat booking rate
- Negotiation engagement

### Platform Metrics
- GMV (Gross Merchandise Value)
- Commission revenue
- Active drivers
- Booking completion rate

---

## 🚀 MVP Recommendation

### What to Build First (4 weeks):

**Phase 1 + Phase 2 (Basic Pricing + Negotiation)**

**Includes:**
1. Driver sets prices per location ✅
2. Customer sees driver prices ✅
3. Customer can make offer ✅
4. Driver can accept/decline ✅
5. Basic auto-accept rules ✅

**Excludes (for later):**
- Smart matching algorithm (Phase 3)
- Full analytics dashboard (Phase 4)
- Advanced packages (Phase 5)

**Why This MVP:**
- Solves immediate pricing problem
- Enables core marketplace value prop
- Can launch and get feedback
- Foundation for advanced features

---

## 📋 Next Steps

1. **Review & Approve This Plan**
   - Confirm phase priorities
   - Adjust timeline if needed
   - Approve database schema

2. **Start Phase 1 (Pricing Foundation)**
   - Create DriverPricing schema
   - Build pricing management UI
   - Implement price calculation

3. **Iterate Based on Feedback**
   - Launch MVP
   - Gather driver/customer feedback
   - Refine before Phase 3

---

## ❓ Questions for You

1. **Commission Rate:** Do you want 15% or different? (affects pricing calculations)

2. **Payment Integration:** Should we integrate M-Pesa for automatic payments?

3. **Currency:** KES only, or multiple currencies?

4. **Pricing Minimums:** Should platform enforce minimum fares? (prevent race to bottom)

5. **Launch Timeline:** Do you want MVP in 4 weeks or full system in 12 weeks?

---

**Ready to proceed with Phase 1?** 🚀
