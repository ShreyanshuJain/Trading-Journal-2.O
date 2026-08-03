# Trading Journal

A professional, multi-user trading journal web app built with React + TypeScript, Vite, Express, Firebase Authentication, Firestore, and Firebase Storage.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide icons
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore (per-user, real-time)
- **Storage**: Firebase Storage (trade screenshots)
- **Server**: Express + Vite dev middleware (port 5000)

## How to run

The workflow `Start application` runs `npm run dev` on port 5000.

## Environment variables (set as Replit env vars)

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Firebase project

Project: `trading-journal-f8d1a`

## Architecture

### Authentication flow
```
User opens app → LoginPage (if not authenticated)
  → "Continue with Google" → Firebase Google OAuth
  → User profile upserted in Firestore users/{uid}
  → JournalProvider mounts with userId
  → Firestore real-time listeners load user's data
  → Dashboard rendered
```

### Firestore data structure
```
users/{uid}                        ← user profile
users/{uid}/trades/{tradeId}       ← individual trades
users/{uid}/accounts/{accountId}   ← trading accounts
users/{uid}/strategies/{stratId}   ← strategies
users/{uid}/tags/{tagId}           ← tags
users/{uid}/settings/preferences   ← user settings
```

### Firebase Storage structure
```
users/{uid}/trades/{tradeId}/{screenshotId}   ← trade screenshots
```

### Security
- Firestore rules: `firestore.rules` — only owner (matching uid) can read/write
- Storage rules: `storage.rules` — only owner can access; images only; max 10 MB

### Key files
- `src/firebase/config.ts` — Firebase initialization
- `src/context/AuthContext.tsx` — Google auth state, signInWithGoogle, logout
- `src/context/JournalContext.tsx` — All journal state + Firestore CRUD
- `src/components/LoginPage.tsx` — Login UI
- `src/components/LoadingScreen.tsx` — Skeleton while auth/data loads
- `src/components/UserMenu.tsx` — User profile dropdown (sidebar footer)

### Data isolation
Every CRUD operation uses the authenticated `userId`. `currentBalance` for accounts is computed from trades in React (not stored in Firestore) to avoid circular updates.

## User preferences

- Wants advanced features: AI insights (Gemini), trade import from CSV
- All data must be per-user and survive logout/browser close
