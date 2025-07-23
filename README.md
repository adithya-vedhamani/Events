# Fullstack Event Booking Platform

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Authentication & Roles](#authentication--roles)
- [Core Functional Requirements](#core-functional-requirements)
- [Edge Cases & Assumptions](#edge-cases--assumptions)
- [Known Limitations](#known-limitations)
- [Deployment & Webhooks](#deployment--webhooks)
- [Scripts & Tools](#scripts--tools)
- [Development & Deployment](#development--deployment)
- [What I'll Do Next](#what-ill-do-next)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
Fullstack application for discovering, booking, and managing events. It supports multiple user roles (Consumers, Brand Owners, Staff), real-time bookings, payments (Razorpay), file uploads (Cloudinary), email notifications, and robust authentication.

---

## Architecture
- **Frontend:** Next.js (React), TypeScript, TailwindCSS, API integration, role-based dashboards, client-side routing, and state management.
- **Backend:** NestJS, TypeScript, MongoDB (Mongoose), JWT Auth, role-based access, RESTful APIs, file uploads, email, payments.

- **Payments:** Razorpay integration for secure online payments and webhooks.
- **File Uploads:** Cloudinary for image storage and CDN delivery.
- **Email:** Nodemailer and Resend for transactional emails (OTP, password reset, notifications).
- **Security:** JWT, role guards, CORS, secure headers, password hashing (bcrypt), and environment-based secrets.

---

## Features
- **User Roles:** Consumer, Brand Owner, Staff (with unique onboarding logic).
- **Authentication:** Email/password, OTP login, JWT-based sessions, password reset.
- **Spaces:** CRUD for event spaces, image uploads, advanced pricing, promo codes.
- **Reservations:** Real-time booking, check-in/out, staff/owner dashboards.
- **Payments:** Razorpay checkout, webhook handling, payment status tracking.
- **Email Notifications:** OTP, password reset, booking confirmations.
- **Analytics:** Brand owner analytics dashboard (planned).
- **Security:** Role-based access, secure headers, input validation, file type/size checks.
- **Extensible:** Modular NestJS and Next.js codebase, easy to add features.

---

## Setup Instructions
### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Razorpay account (test keys)
- Gmail or Resend for email

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/events.git
cd events
```

### 2. Install Dependencies
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 3. Configure Environment Variables
#### Backend
Create a `.env` file in `backend/` (see below for all keys):
```env
# Database
MONGODB_URI=

# JWT Authentication
JWT_SECRET=supersecretkey1234567890
JWT_REFRESH_SECRET=supersecretkey1234567890

# Razorpay Configuration
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# File Upload (for space images)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Redis (for caching and sessions)
REDIS_URL=redis://localhost:6379

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend Email Configuration
RESEND_API_KEY=

```
#### Frontend
Create a `.env.local` in `frontend/` (see `env.local.example`):
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://ypur-app.onrender.com

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=r

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here


# File Upload 
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google Maps 
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Analytics 
NEXT_PUBLIC_GA_TRACKING_ID=your_ga_tracking_id

# Application
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=


RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

```

### 4. Run the Applications
#### Backend
```bash
cd backend
npm run start:dev
```
#### Frontend
```bash
cd frontend
npm run dev
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

---

## Environment Variables
**See** `backend/.env` and `frontend/env.local.example` for all required variables.
- **Security:** Never commit real secrets to version control.
- **Cloudinary:** Used for image uploads.
- **Razorpay:** Used for payment processing.
- **Email:** Used for OTP, password reset, and notifications.

---

## Authentication & Roles
- **JWT Auth:** All APIs are protected by JWT, issued on login/OTP.
- **Roles:** `consumer`, `brand_owner`, `staff` (with unique onboarding).
- **Role Guards:** Backend endpoints are protected by role-based guards.
- **Staff Onboarding:** Staff accounts are created by brand owners, with emails in the format `staff1.[brandowner-email]`.
- **Session Handling:** JWT stored in localStorage; logout clears tokens and user data.
- **OTP Login:** Users can login via OTP sent to their email.
- **Password Reset:** Via OTP to email, with expiry and validation.

---

## Core Functional Requirements
- **Authentication:** Email + password, JWT access + refresh tokens, password reset.
- **Space Management (Brand Owner):**
  - Fields: name, description, address (Google Maps/OpenStreetMap search), capacity, amenities, images.
  - Pricing Engine: free, hourly/day rates, peak/off-peak multipliers, time-block bundles, monthly passes, promo codes, special event overrides.
- **Reservation Workflow (Consumer):**
  - Availability calendar, dynamic price breakdown, checkout with Razorpay, confirmation email.
- **Check-In Dashboard (Staff):**
  - Real-time list, search/filter, quick status update (checked-in, no-show, checked-out).
- **Payments & Refunds:**
  - Webhook handling for successful, failed, or refunded payments; status must stay consistent in MongoDB.
- **Bundles & Time Blocks:**
  - Bundles and time blocks are present in the codebase, but not fully implemented due to time constraints.

---

## Edge Cases & Assumptions
- **Staff Creation:** Only brand owners can create staff. Staff emails must follow a strict format.
- **Unique Emails:** All users must have unique emails.
- **Role Enforcement:** All sensitive actions are protected by role guards.
- **File Uploads:** Only images (jpg, jpeg, png, webp) up to 5MB are allowed.
- **Booking Conflicts:** Backend checks for overlapping reservations.
- **Payment Webhooks:** Razorpay webhooks are validated using the secret.
- **Email Delivery:** Fallback to Resend if SMTP fails (optional).
- **Token Expiry:** JWT tokens expire after 24h; refresh logic can be added.
- **Inactive Users:** Users can be deactivated; inactive users cannot login.
- **Brand Association:** Staff are always linked to a brand owner via `brandId`.
- **Error Handling:** All API errors are returned with clear messages; frontend displays user-friendly errors.

---

## Known Limitations
- **No Social Login:** Only email/password and OTP are supported.
- **No Multi-Tenancy:** Each staff is linked to a single brand owner.
- **No Real-Time Updates:** No WebSocket or push notifications (yet). Manual refresh is required to load new data.
- **No Automated Tests:** Manual testing and e2e scripts only.
- **No Admin Panel:** No superadmin role or UI for platform-wide management.
- **No Rate Limiting:** API is not rate-limited by default.
- **No Internationalization:** English-only UI and emails.
- **Hydration Errors:** Some hydration and caching issues exist in the frontend due to time constraints.
- **Bundles/Time Blocks:** Present in code, not fully implemented.

---

## Deployment & Webhooks
- **Backend Deployment:** Deployed to [Render.com](https://render.com/).
- **Razorpay Webhooks:**
  - Webhooks are configured in the Razorpay dashboard to point to `/api/payments/webhook` on the deployed backend.
  - Signature verification is implemented using the `RAZORPAY_WEBHOOK_SECRET` to ensure authenticity.
  - On webhook events (payment success, failure, refund), the backend updates MongoDB to keep payment and booking status consistent.
  - Webhook source code is in `backend/src/payments/webhooks.controller.ts` and `razorpay.service.ts`.
- **iCal/Google Calendar Export:**
  - Booking confirmation emails include an iCal attachment if payment is successful.

---

## Scripts & Tools
### Backend
- **Staff Creation:** `node scripts/create-staff-bcrypt.js`
- **Booking Checks:** `node scripts/check-bookings.js`
- **List Reservations:** `node scripts/list-brand-reservations.js`
- **Test Webhooks:** `node scripts/test-webhook.js`
- **E2E Tests:** `npm run test:e2e`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format`
### Frontend
- **Linting:** `npm run lint`
- **Formatting:** `npm run format`
- **Build:** `npm run build`
- **Start:** `npm run start`

---

## Development & Deployment
- **Local Development:** Use `.env` and `.env.local` for secrets.
- **Production:** Set all secrets via environment variables in your deployment platform.
- **Build:** Use `npm run build` in both frontend and backend before deploying.
- **Security:** Always use strong secrets and HTTPS in production.

---

## Contributing
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License

This project is licensed under the MIT License.
