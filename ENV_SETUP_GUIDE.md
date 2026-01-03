# Environment Variables Setup Guide

## 🚨 Problem: Agent Not Getting Internet Connection

Your Firebase agent (HTTP client) cannot connect because **environment variables are missing**. Firebase needs these to initialize and connect to Firebase servers.

## ✅ Solution: Create `.env.local` File

### Step 1: Create the file
Create a file named `.env.local` in the root directory of your project.

### Step 2: Add Firebase Configuration (REQUIRED)

Get your Firebase config from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Add Optional Services

```env
# Google Maps API Key (Optional - for maps functionality)
# Get from: https://console.cloud.google.com/apis/credentials
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Resend API Key (Optional - for sending emails)
# Get from: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here

# Cloudinary Configuration (Optional - for image uploads)
# Get from: https://cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 📍 How to Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → Web (</>) icon
6. Copy the config values from the `firebaseConfig` object

## 🔄 After Creating `.env.local`

1. **Restart your development server** (if running):
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

2. **Verify connection**: The Firebase agent should now be able to connect to Firebase servers.

## ⚠️ Important Notes

- **Never commit `.env.local` to git** (it's already in `.gitignore`)
- **Restart the server** after creating/updating `.env.local`
- **All `NEXT_PUBLIC_*` variables** are exposed to the browser (safe for Firebase config)
- **Server-only variables** (like `RESEND_API_KEY`) are not exposed to the browser

## 🐛 Troubleshooting

If you still have connection issues after setting up `.env.local`:

1. **Check file name**: Must be exactly `.env.local` (not `.env` or `.env.local.txt`)
2. **Check location**: Must be in the project root (same folder as `package.json`)
3. **Check values**: Make sure there are no quotes around the values
4. **Restart server**: Always restart after creating/updating environment variables
5. **Check Firebase project**: Ensure your Firebase project is active and billing is enabled (if required)

## 📝 Example `.env.local` File

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyExample123456789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=taxi-tao.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=taxi-tao
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=taxi-tao.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```











