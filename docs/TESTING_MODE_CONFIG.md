# Testing Mode Configuration

This document explains how to manage the testing phase and transition to production.

## 🎛️ Testing Mode Toggle

The app uses a centralized configuration system to control testing features. This allows you to easily switch between testing and production modes.

### Configuration Location
**Firebase**: `appSettings/testingMode`

```typescript
interface TestingModeConfig {
  isActive: boolean;           // Master switch for all testing features
  showDownloadPage: boolean;   // Show /download page
  showTestingBanners: boolean; // Show testing banners in app
  allowFeedback: boolean;      // Allow feedback submission
  showInAdminMenu: boolean;    // Show testing links in admin panel
  lastUpdated: Timestamp;
  updatedBy: string;           // Admin who made the change
}
```

## 🔧 How It Works

### When Testing Mode is ON (`isActive: true`):
- ✅ `/download` page is accessible
- ✅ Testing banners appear on dashboards
- ✅ Feedback submission is enabled
- ✅ Admin can see "Testing Management" menu
- ✅ Testing collections are active

### When Testing Mode is OFF (`isActive: false`):
- ❌ `/download` redirects to home
- ❌ No testing banners shown
- ❌ Feedback submission disabled
- ❌ Testing menu hidden from admin
- ⚠️ Testing data remains in database (use cleanup tool)

## 🧹 Data Cleanup Options

### Option 1: Soft Delete (Recommended)
Archives testing data instead of deleting it. Allows you to review feedback later.

**What it does:**
- Marks all `testingFeedback` as `archived: true`
- Deactivates all `testingBanners`
- Keeps data for historical reference

### Option 2: Hard Delete (Permanent)
Completely removes all testing data from Firestore.

**What it deletes:**
- All documents in `testingFeedback`
- All documents in `testingBanners`
- Testing-related `appDownloads` entries
- Testing guides

**What it keeps:**
- User accounts (drivers/customers who tested)
- Booking data from test rides
- Driver profiles

### Option 3: Selective Cleanup
Choose what to keep and what to delete.

## 🚀 Production Transition Checklist

When you're ready to go live:

1. **Review Feedback** (Optional)
   - Export all feedback to markdown
   - Review critical issues
   - Ensure all bugs are resolved

2. **Disable Testing Mode**
   - Go to Admin Panel → Testing Management
   - Click "Disable Testing Mode"
   - Confirm the action

3. **Clean Up Data**
   - Choose cleanup option (Soft/Hard/Selective)
   - Run cleanup utility
   - Verify data is cleaned

4. **Update Firestore Rules** (Optional)
   - Remove testing collection rules if doing hard delete
   - Redeploy: `firebase deploy --only firestore:rules`

5. **Remove Testing Code** (Optional for v2.0)
   - Delete `/download` page
   - Remove testing components
   - Clean up unused imports

## 📋 Quick Commands

### Check Testing Mode Status
```typescript
// In any component
import { getTestingModeConfig } from '@/lib/testing-config';
const config = await getTestingModeConfig();
console.log('Testing mode:', config.isActive);
```

### Toggle Testing Mode (Admin Only)
```typescript
import { setTestingMode } from '@/lib/testing-config';
await setTestingMode(false); // Disable testing
```

### Clean Up Testing Data
```typescript
import { cleanupTestingData } from '@/lib/testing-cleanup';
await cleanupTestingData('soft'); // or 'hard' or 'selective'
```

## 🎯 Best Practice

**Recommended Approach:**
1. Keep testing mode ON during beta (1-2 months)
2. When ready for production:
   - Export feedback to markdown
   - Disable testing mode (keeps data)
   - Monitor for 1 week
3. After 1 week of stable production:
   - Run soft delete (archives data)
4. After 1 month:
   - Run hard delete if needed (permanent cleanup)

This gives you time to review feedback and ensures nothing important is lost.
