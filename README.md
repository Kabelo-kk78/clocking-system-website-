# Attendance System

Next.js attendance and clocking system using Firebase Authentication and
Firestore, with daily QR codes and server-side geofence validation.

## Getting Started

Install dependencies and configure the variables listed in `.env.example`:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

- `npm run dev` starts the development server.
- `npm run lint` checks the codebase with ESLint.
- `npm run build` typechecks and creates a production build.
- `npm run seed` creates the admin and demo employee records.

## Firebase

The server uses the Firebase Admin SDK for Firestore and authentication. Set
the required Firebase web and Admin SDK variables from `.env.example` before
using authenticated flows. Firestore rules and indexes are deployed with:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```
