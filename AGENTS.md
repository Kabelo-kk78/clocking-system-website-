# Attendance System — Coding Guidelines

Stack: Next.js 16 (App Router), TypeScript (strict), Firebase (Firestore + Firebase Auth),
Resend for email, Tailwind CSS, Zod for validation, `qrcode` for QR generation.

## Commands
- `npm run dev` — run development server
- `npm run lint` — ESLint
- `npm run build` — typecheck + production build
- `npm run seed` — seed admin + demo employees (creates Firebase Auth users + Firestore profiles)

## Rules
- One file = one responsibility. Keep files small (~100 lines or fewer).
- Server actions: `'use server'` -> `auth()` (from `lib/auth`) check -> permission check ->
  Zod validation -> service call -> `revalidatePath()`.
- Services: query Firestore directly via the repositories in `lib/firestore/*`. Return plain
  objects (never Firestore DocumentSnapshot instances).
- All user input validated with Zod schemas in `lib/validation`.
- Firestore access via `getAdminFirestore()` (Admin SDK). Never use the client SDK on the server.
- Client-side Firebase reads via `lib/firebase/client.ts` and `client-auth.ts` only.
- Email sending is fire-and-forget: errors logged, do not block the response.
- Dates: South African context (`en-ZA`, UTC+2 / Africa/Johannesburg timezone).
- Use `cn()` utility for conditional classnames, Tailwind only.
- Roles: `admin` and `employee`. Check permissions via `lib/permissions.ts` `hasPermission()`.
- Sessions: Firebase Auth session cookie (`attendance-session`). `auth()` reads/certifies it and
  returns an `AppSession`. Login exchanges an ID token for a session cookie via `exchangeTokenForSession`.
- Daily QR codes are generated at 07:00 (Africa/Johannesburg) via `vercel.json` cron hitting
  `/api/cron/daily-qr`, or manually via the admin "Send today's codes" action.
- Geofence: single office location from env (`GEOFENCE_LATITUDE`, `GEOFENCE_LONGITUDE`,
  `GEOFENCE_RADIUS_METERS` = 50). Clock-in is rejected outside the radius (Haversine distance).
- Check-in is token-based (no session required): employee scans QR linking `/checkin/[token]`.

## Firestore collections
- `users/{uid}` — user profile (fullName, email, role, employeeNumber, department, isActive)
- `attendance/{userId}__{date}` — attendance records (one per user per day)
- `dailyQrCodes/{token}` — daily QR codes

## Auth
- Login: client `signInWithEmailAndPassword` -> `exchangeTokenForSession(idToken)` server action.
- Sign out: `signOutAction()` deletes the session cookie.
- Route protection is enforced at the layout level via `auth()` (no middleware).

## Env
See `.env.example` for all required variables. Never commit `.env*`.
- Firebase Web SDK: `NEXT_PUBLIC_FIREBASE_*`
- Firebase Admin: `FIREBASE_SERVICE_ACCOUNT` (base64 JSON) or `GOOGLE_APPLICATION_CREDENTIALS`.
