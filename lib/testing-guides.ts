/**
 * Testing Guides Service
 * 
 * Manages dynamic testing guides stored in Firestore.
 * Allows admins to update guides without code changes.
 */

import { collection, doc, getDoc, getDocs, setDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";

export interface GuideSection {
  title: string;
  content: string;
  order: number;
}

export interface TestingGuide {
  id: string;
  role: "driver" | "customer";
  title: string;
  sections: GuideSection[];
  lastUpdated: Date;
}

/**
 * Get testing guide for a specific role
 */
export async function getTestingGuide(role: "driver" | "customer"): Promise<TestingGuide | null> {
  try {
    const docRef = doc(db, "testingGuides", `${role}-guide`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        role: data.role,
        title: data.title,
        sections: data.sections,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${role} guide:`, error);
    return null;
  }
}

/**
 * Get all testing guides
 */
export async function getAllTestingGuides(): Promise<TestingGuide[]> {
  try {
    const guidesSnapshot = await getDocs(collection(db, "testingGuides"));
    return guidesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        title: data.title,
        sections: data.sections,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching all guides:", error);
    return [];
  }
}

/**
 * Create or update a testing guide
 */
export async function saveTestingGuide(guide: Omit<TestingGuide, "id" | "lastUpdated">): Promise<void> {
  try {
    const docRef = doc(db, "testingGuides", `${guide.role}-guide`);
    await setDoc(docRef, {
      ...guide,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Error saving guide:", error);
    throw error;
  }
}

/**
 * Initialize default testing guides (run once during setup)
 */
export async function initializeDefaultGuides(): Promise<void> {
  const driverGuide: Omit<TestingGuide, "id" | "lastUpdated"> = {
    role: "driver",
    title: "Driver Testing Guide",
    sections: [
      {
        title: "Welcome, Driver! 🚗",
        content: "Thank you for helping test Taxi-Tao! This guide will help you test the app effectively and report any issues you encounter.",
        order: 1,
      },
      {
        title: "What You'll Test",
        content: `### 1. Account & Profile
- Sign up with your test email
- Complete driver verification
- Upload documents (test documents OK)
- Update profile picture
- Edit phone number

### 2. Going Online/Offline
- Toggle online status
- Check if you appear on customer map
- Test offline mode

### 3. Accepting Rides
- Receive ride request notification
- View pickup location
- Accept ride
- Reject ride
- Auto-reject after timeout

### 4. During Ride
- Navigate to pickup
- Confirm passenger pickup
- Navigate to destination
- Complete ride
- Rate customer

### 5. Earnings
- View daily earnings
- View weekly/monthly summaries
- Check ride history`,
        order: 2,
      },
      {
        title: "What to Look For",
        content: `### 🐛 Bugs
- App crashes
- Buttons not working
- Wrong information displayed
- Features not responding

### 🎨 UI Issues
- Text too small
- Colors hard to see
- Layout broken
- Icons missing

### ⚡ Performance
- App slow to load
- Map lagging
- Notifications delayed
- Battery draining fast`,
        order: 3,
      },
      {
        title: "How to Report",
        content: `1. Tap testing banner at top of dashboard
2. Fill feedback form with:
   - Clear title
   - Detailed description
   - Screenshot if possible
3. Submit!

We'll review within 24 hours.`,
        order: 4,
      },
    ],
  };

  const customerGuide: Omit<TestingGuide, "id" | "lastUpdated"> = {
    role: "customer",
    title: "Customer Testing Guide",
    sections: [
      {
        title: "Welcome, Tester! 👤",
        content: "Thank you for helping test Taxi-Tao! Your feedback will help us create the best taxi booking experience.",
        order: 1,
      },
      {
        title: "What You'll Test",
        content: `### 1. Account Setup
- Create an account
- Verify your email
- Update your profile
- Add payment methods (test mode)

### 2. Finding Drivers
- Browse available drivers on map
- Search by location
- Filter by vehicle type
- View driver ratings

### 3. Booking a Ride
- Enter pickup location
- Enter drop-off location
- Select service type
- Submit booking request
- Receive confirmation

### 4. During Your Ride
- Track driver in real-time
- View estimated arrival time
- Contact driver (call/message)
- Monitor route

### 5. After the Ride
- Rate your driver
- Leave a review
- View ride history
- Check receipts`,
        order: 2,
      },
      {
        title: "What to Look For",
        content: `### 🐛 Bugs
- App crashes or freezes
- Booking fails to submit
- Map not loading
- Payment errors

### 🎨 UI Issues
- Text overlapping
- Buttons hard to tap
- Images not loading
- Layout issues on your device

### ⚡ Performance
- Slow loading times
- Map lag
- Delayed notifications
- High battery usage`,
        order: 3,
      },
      {
        title: "How to Report",
        content: `1. Tap the testing banner on your dashboard
2. Fill out the feedback form:
   - Title: Short description
   - Details: What happened?
   - Category: Bug, UI, Performance, etc.
   - Screenshot: If applicable
3. Submit!

Your feedback helps us improve!`,
        order: 4,
      },
    ],
  };

  await saveTestingGuide(driverGuide);
  await saveTestingGuide(customerGuide);
  console.log("Default testing guides initialized");
}
