# Security Remediation - Manual Steps Guide

> **URGENT:** Complete these steps BEFORE deploying to production.
> Steps 1-2 are CRITICAL (rotate compromised credentials).
> Steps 3-7 are HIGH priority (deployment and verification).

---

## Step 1: Rotate Firebase Service Account Key (CRITICAL)

The old service account key is committed to git history and is **compromised**.

### 1.1 Generate New Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **studio-6444216032-ee9f7**
3. Navigate to **Project Settings** (gear icon) > **Service accounts**
4. Click **Generate new private key**
5. Save the JSON file as `firebase-service-account-new.json` (DO NOT commit this)
6. Click **Done**

### 1.2 Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **Taxi-Tao** project
3. Navigate to **Settings** > **Environment Variables**
4. Update these variables with the new key values:
   ```
   FIREBASE_ADMIN_PROJECT_ID=studio-6444216032-ee9f7
   FIREBASE_ADMIN_CLIENT_EMAIL=<copy from new JSON>
   FIREBASE_ADMIN_PRIVATE_KEY=<copy from new JSON, keep the \n escapes>
   ```
5. Click **Save** for each variable

### 1.3 Delete Old Key from Git History

```powershell
# Install BFG Repo Cleaner (if not installed)
choco install bfg

# Remove the service account file from all git history
bfg --delete-files "firebase-service-account.json"

# Clean up
cd C:\Users\Administrator\Desktop\Taxi-Tao
git reflog expire --expire=now --all
git gc --prune=now --force

# Force push (WARNING: this rewrites history)
git push origin main --force
```

**Alternative (without BFG):**
```powershell
# Using git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scratch/firebase-service-account.json" \
  --prune-empty --tag-name-filter cat -- --all

git push origin main --force
```

### 1.4 Verify Old Key is Revoked

1. Go to Firebase Console > **Project Settings** > **Service accounts**
2. Check that the old service account email (`firebase-adminsdk-fbsvc@studio-6444216032-ee9f7.iam.gserviceaccount.com`) is **not listed** or has been replaced
3. If old key still appears, delete it from Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **IAM & Admin** > **Service accounts**
   - Find the old service account
   - Click **Delete**

---

## Step 2: Set Server-Only Environment Variables (CRITICAL)

The admin emails were exposed via `NEXT_PUBLIC_` prefix. They are now renamed.

### 2.1 Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **Taxi-Tao** project
3. Navigate to **Settings** > **Environment Variables**
4. **Add** these new variables (NOT `NEXT_PUBLIC_` prefix):
   ```
   MAIN_ADMIN_EMAIL=<your-super-admin-email>
   MAIN_ADMIN_ACTION_EMAIL=<your-action-admin-email>
   ```
5. Click **Save**
6. **Delete** the old variables if they exist:
   - `NEXT_PUBLIC_MAIN_ADMIN_EMAIL`
   - `NEXT_PUBLIC_MAIN_ADMIN_ACTION_EMAIL`

### 2.2 Update Local Development

1. Open `.env.local` in your editor
2. Add the new variables:
   ```
   MAIN_ADMIN_EMAIL=your-super-admin-email@example.com
   MAIN_ADMIN_ACTION_EMAIL=your-action-admin-email@example.com
   ```
3. Remove the old `NEXT_PUBLIC_MAIN_ADMIN_*` lines if present

---

## Step 3: Deploy Firestore Rules

The duplicate match blocks have been fixed. Deploy the updated rules.

### 3.1 Test Locally First

```powershell
cd C:\Users\Administrator\Desktop\Taxi-Tao

# Start Firebase emulator
firebase emulators:start --only firestore

# In another terminal, test the rules
# (Use Firebase console Rules Playground or write test scripts)
```

### 3.2 Deploy to Production

```powershell
cd C:\Users\Administrator\Desktop\Taxi-Tao

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### 3.3 Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** > **Rules**
3. Verify the rules show:
   - No duplicate `match /notifications` blocks
   - No duplicate `match /driverNotifications` blocks
   - No duplicate `match /app_crashes` blocks
   - No duplicate `allow list` in `match /companies`
   - No testing collections (`testingQuestions`, `testingConfig`, etc.)
   - `app_crashes` create requires `isSignedIn() && isEmailVerified()`

---

## Step 4: Deploy to Vercel

```powershell
cd C:\Users\Administrator\Desktop\Taxi-Tao

# Stage all changes
git add .
git status  # Review what will be committed

# Commit with descriptive message
git commit -m "security: fix critical vulnerabilities

- Move session cookies to httpOnly server-side API routes
- Remove forgeable plain UID session fallback
- Fix Firestore rules: remove duplicate match blocks, restore email verification
- Add CSP header, remove deprecated X-XSS-Protection
- Replace all Math.random() with crypto APIs
- Fix CORS: restrict to taxitao.co.ke only
- Add DOMPurify for XSS prevention
- Fix CSV injection in report generation
- Rewrite payment routes to use Admin SDK
- Remove NEXT_PUBLIC_ prefix from admin emails
- Add admin role check to email API
- Clean PII from console logs"

# Push to trigger deployment
git push origin main
```

---

## Step 5: Post-Deployment Verification

### 5.1 Test Session Security

1. Open browser DevTools > **Application** > **Cookies**
2. Sign in to the app
3. Verify cookies are set with:
   - `httpOnly` flag: **YES**
   - `secure` flag: **YES** (in production)
   - `sameSite`: **Lax**
4. Verify you cannot read cookies via `document.cookie` in console

### 5.2 Test Authentication

1. Open browser DevTools > **Network** tab
2. Try accessing `/admin` without logging in
3. Verify you are redirected to `/login`
4. Try accessing `/api/vendor/reports` without auth
5. Verify you get `401 Unauthorized`

### 5.3 Test Firestore Rules

1. In Firebase Console > **Firestore Database** > **Rules Playground**
2. Test `notifications` collection:
   - Unauthenticated user trying to create: **Should fail**
   - Authenticated user with unverified email trying to create: **Should fail**
   - Authenticated user with verified email trying to create: **Should succeed**
3. Test `app_crashes` collection:
   - Unauthenticated user trying to create: **Should fail**
   - Authenticated user with verified email trying to create: **Should succeed**

### 5.4 Test Email API (Admin Only)

1. Log in as admin
2. Try sending email via the API
3. Verify it works
4. Log in as a customer
5. Try sending email via the API
6. Verify you get `403 Forbidden`

### 5.5 Test CSV Reports

1. Log in as a vendor
2. Generate a CSV report
3. Open the CSV in Excel
4. Verify no formula injection (cells starting with `=`, `+`, `-` should be prefixed with `'`)

---

## Step 6: Monitor for Issues

### 6.1 Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the project
3. Navigate to **Logs**
4. Look for:
   - `401 Unauthorized` errors (expected for unauthenticated requests)
   - `Firebase Auth token verification failed` (indicates invalid tokens)
   - Any unexpected errors

### 6.2 Check Firebase Logs

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** > **Usage**
3. Monitor for unusual read/write patterns

### 6.3 Check for Console Errors

1. Open the deployed site in browser
2. Open DevTools > **Console**
3. Look for any CSP violations or errors

---

## Step 7: Cleanup (Optional but Recommended)

### 7.1 Delete scratch/ Directory

The `scratch/` directory contains debug scripts with hardcoded PII. Delete it before production:

```powershell
cd C:\Users\Administrator\Desktop\Taxi-Tao
git rm -r scratch/
git commit -m "chore: remove scratch debug scripts"
git push origin main
```

### 7.2 Review .env.local

Ensure `.env.local` does NOT contain:
- Old `NEXT_PUBLIC_MAIN_ADMIN_*` variables
- Any hardcoded API keys that should be in Vercel only

### 7.3 Update Documentation

Update `SECURITY_FRAMEWORK.md` to reflect:
- Session cookies are now httpOnly
- Admin emails are server-only
- Firestore rules have been cleaned up
- CSP is now enabled

---

## Troubleshooting

### "Session cookie not set" after login

- Check that `app/api/auth/session/route.ts` exists
- Verify the API route is accessible at `/api/auth/session`
- Check Vercel logs for errors in the route

### Firestore rules deployment fails

- Check for syntax errors in `firestore.rules`
- Run `firebase emulators:start` to test locally
- Ensure you have the correct Firebase project selected

### CSP blocking scripts

- Check browser console for CSP violation errors
- The CSP in `next.config.ts` allows `unsafe-inline` and `unsafe-eval` for Next.js compatibility
- If scripts are blocked, update the CSP to include the blocked domain

### Build fails with type errors

- The pre-existing type errors are unrelated to security changes
- Run `npm run build` and fix any new errors introduced by the security changes
- Use `// @ts-ignore` for pre-existing issues if needed

---

## Rollback Plan

If something goes wrong after deployment:

1. **Session issues:** Revert `lib/auth-context.tsx` and `lib/auth-server.ts` changes
2. **Firestore rules:** Deploy the previous rules version:
   ```powershell
   firebase deploy --only firestore:rules --project <project-id>
   ```
3. **CORS issues:** Revert `cors.json` to `["*"]` temporarily
4. **Full rollback:**
   ```powershell
   git revert HEAD
   git push origin main
   ```

---

*Generated by security audit - 2026-06-02*
