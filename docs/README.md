# TaxiTao - Taxi Service Platform

A modern Next.js application for managing taxi services with subscription-based driver management, WhatsApp booking, and M-Pesa payment integration.

## Features

- 🚕 **Dynamic Driver Profiles** - Firestore-powered driver listings
- 📱 **WhatsApp Booking** - Direct booking via WhatsApp
- 💳 **M-Pesa Payments** - Manual M-Pesa payment instructions
- 🔐 **Driver Authentication** - Secure login for drivers
- 📊 **Driver Dashboard** - Subscription status and payment tracking
- 👔 **Admin Panel** - Payment verification and driver management
- 💰 **Subscription System** - Monthly fee (1000 KSH) due on 5th of each month

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage + Cloudinary
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Cloudinary account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Taxi-Tao
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Firebase and Cloudinary credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## Admin Setup

### Admin Credentials

**Email:** titwzmaihya@gmail.com  
**Phone:** +254708674665

### Setup Admin Account

1. Go to Firebase Console → Authentication → Users
2. Add user with email: `titwzmaihya@gmail.com`
3. Copy the User UID
4. Go to Firestore Database
5. Create collection `users`
6. Add document with UID as ID:
   ```json
   {
     "id": "<USER_UID>",
     "email": "titwzmaihya@gmail.com",
     "role": "admin",
     "createdAt": <TIMESTAMP>
   }
   ```

See [ADMIN_SETUP.md](./ADMIN_SETUP.md) for detailed instructions.

## Key Routes

- `/` - Homepage with driver listings
- `/booking` - Booking page (WhatsApp + M-Pesa)
- `/d/[driverId]` - Individual driver profile
- `/driver/login` - Driver login
- `/driver/dashboard` - Driver dashboard
- `/admin/panel` - Admin panel (requires admin role)

## Subscription System

### How It Works

1. **Monthly Fee:** 1000 KSH (subject to company policy)
2. **Due Date:** 5th of each month
3. **Payment Method:** M-Pesa to Till 7323090 (Titus Kipkirui)
4. **Verification:** Manual verification by admin
5. **Visibility:** Drivers with expired payments are hidden from public

### Driver Workflow

1. Driver logs in at `/driver/login`
2. Views subscription status on dashboard
3. Sends payment via M-Pesa
4. Contacts admin with transaction code
5. Admin verifies payment
6. Driver profile becomes public

### Admin Workflow

1. Admin logs in at `/admin/panel`
2. Views pending payment verifications
3. Verifies M-Pesa transaction
4. Clicks "Verify" to activate driver
5. Driver's next payment due set to 5th of next month

## M-Pesa Payment Details

**Till Number:** 7323090  
**Account Name:** Titus Kipkirui  
**Amount:** 1000 KSH (monthly subscription)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables

Add all `.env.local` variables to Vercel:
- Project Settings → Environment Variables
- Add each variable from `.env.local`

### Firestore Security Rules

Deploy security rules from [ADMIN_SETUP.md](./ADMIN_SETUP.md) to protect your database.

## Project Structure

```
app/
├── page.tsx                    # Homepage
├── booking/page.tsx            # Booking page
├── d/[driverId]/page.tsx       # Driver profiles
├── driver/
│   ├── login/page.tsx          # Driver login
│   └── dashboard/page.tsx      # Driver dashboard
└── admin/
    └── panel/page.tsx          # Admin panel

components/
├── Navbar.tsx                  # Navigation
├── Footer.tsx                  # Footer
├── BookingForm.tsx             # WhatsApp booking
├── DriverCard.tsx              # Driver display card
└── MpesaPayment.tsx            # M-Pesa payment UI

lib/
├── firebase.ts                 # Firebase config
├── firestore.ts                # Firestore helpers
├── types.ts                    # TypeScript interfaces
├── auth-context.tsx            # Auth provider
└── subscription-utils.ts       # Subscription utilities
```

## Support

For support, contact:
- **Phone:** +254 708 674 665
- **Email:** info@taxitao.co.ke
- **Admin:** titwzmaihya@gmail.com

## License

Proprietary - TaxiTao Services
