# Firebase Collections Structure for Testing Phase

This document defines the Firestore collections and their schemas for the Taxi-Tao testing phase.

## Collection 1: `testingFeedback`

**Purpose**: Store all user-submitted feedback, bug reports, and feature requests.

### Schema
```typescript
interface TestingFeedback {
  id: string; // Auto-generated
  
  // User Information
  userId: string;
  userRole: "driver" | "customer" | "admin";
  userName: string;
  userEmail: string;
  userPhone?: string;
  
  // Feedback Content
  title: string; // Max 100 chars
  description: string; // Max 1000 chars
  category: "bug" | "feature" | "ui" | "performance" | "other";
  priority: "low" | "medium" | "high" | "critical";
  
  // Status Tracking
  status: "open" | "in-progress" | "resolved" | "closed";
  
  // Media
  screenshots: string[]; // Firebase Storage URLs
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Admin Actions (only admins can write)
  adminComments: Array<{
    adminId: string;
    adminName: string;
    comment: string;
    timestamp: Timestamp;
  }>;
  
  // User Responses
  responses: Array<{
    userId: string;
    userName: string;
    message: string;
    timestamp: Timestamp;
  }>;
  
  // Metadata
  isTestAccount: boolean;
  deviceInfo: {
    platform: "android" | "ios";
    model: string;
    osVersion: string;
    appVersion: string;
  };
}
```

### Indexes Required
```javascript
// Composite index for filtering
testingFeedback: {
  userRole: "asc",
  status: "asc",
  createdAt: "desc"
}

testingFeedback: {
  priority: "desc",
  createdAt: "desc"
}
```

---

## Collection 2: `testingBanners`

**Purpose**: Dynamic banners displayed in the mobile app to communicate with testers.

### Schema
```typescript
interface TestingBanner {
  id: string;
  
  // Content
  title: string;
  message: string;
  
  // Targeting
  targetRoles: Array<"driver" | "customer" | "admin">;
  
  // Display Settings
  isActive: boolean;
  priority: "info" | "warning" | "error";
  
  // Actions
  actionUrl?: string; // e.g., "/testing-info"
  actionText?: string; // e.g., "Learn More"
  
  // Lifecycle
  createdAt: Timestamp;
  expiresAt?: Timestamp; // Optional auto-hide
}
```

---

## Collection 3: `appDownloads`

**Purpose**: Centralized management of APK download links and analytics.

### Schema
```typescript
interface AppDownload {
  id: string; // e.g., "current-version"
  
  // Download Info
  downloadUrl: string;
  version: string; // e.g., "1.0.0"
  buildType: "preview" | "production";
  isActive: boolean;
  downloadMessage: string; // Warning message
  
  // Analytics
  downloadCount: number;
  lastDownloadAt?: Timestamp;
  downloadHistory: Array<{
    timestamp: Timestamp;
    userAgent: string;
    // Note: Do NOT store IP addresses for privacy
  }>;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Collection 4: `testingGuides`

**Purpose**: Structured testing guides for different user roles.

### Schema
```typescript
interface TestingGuide {
  id: string; // e.g., "driver-guide"
  
  // Guide Info
  role: "driver" | "customer";
  title: string;
  
  // Content Sections
  sections: Array<{
    title: string;
    content: string; // Markdown supported
    order: number;
  }>;
  
  // Metadata
  lastUpdated: Timestamp;
}
```

---

## Initial Data Setup

### Sample Banner (to be created in Firestore)
```javascript
{
  id: "testing-phase-active",
  title: "Testing Phase Active",
  message: "We're testing! Your feedback helps us improve.",
  targetRoles: ["driver", "customer"],
  isActive: true,
  priority: "info",
  actionUrl: "/testing-info",
  actionText: "Learn More",
  createdAt: Firebase.Timestamp.now(),
  expiresAt: null
}
```

### Sample Download Info
```javascript
{
  id: "current-version",
  downloadUrl: "https://expo.dev/artifacts/eas/s7y3KG1583xbKYZDen2XSG.apk",
  version: "1.0.0",
  buildType: "preview",
  isActive: true,
  downloadMessage: "⚠️ Testing Version - May contain bugs",
  downloadCount: 0,
  downloadHistory: [],
  createdAt: Firebase.Timestamp.now(),
  updatedAt: Firebase.Timestamp.now()
}
```

---

## Next Steps
1. Create these collections in Firebase Console
2. Add initial sample data
3. Configure Firestore security rules (see firestore.rules)
4. Test read/write operations from both mobile and web
