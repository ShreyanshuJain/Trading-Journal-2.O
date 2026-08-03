---
name: Firebase Firestore architecture
description: How Firestore is used in the Trading Journal; key design decisions about data isolation and computed fields
---

## Rule
`currentBalance` for Account documents is NOT stored in Firestore. It is computed in React via `useMemo` from `rawAccounts + trades`. This prevents a circular update loop (Firestore write → onSnapshot → balance recalc → Firestore write).

**Why:** The original code stored `currentBalance` and recalculated it via `useEffect`. With Firestore real-time listeners, writing computed state back to Firestore triggers another snapshot, causing infinite loops.

**How to apply:** When writing account documents to Firestore, always omit `currentBalance`. When reading, initialize it to `0`; the useMemo will compute the real value. Export `accounts: Account[]` (with computed balance) from context, backed internally by `rawAccounts` state.

## Data structure
```
users/{uid}                        ← user profile (displayName, email, photoURL, createdAt, lastLoginAt)
users/{uid}/trades/{tradeId}
users/{uid}/accounts/{accountId}   ← stored WITHOUT currentBalance
users/{uid}/strategies/{stratId}
users/{uid}/tags/{tagId}
users/{uid}/settings/preferences
users/{uid}/trades/{id}/{screenshotId}  ← Firebase Storage path
```

## Seeding
New users get seeded with `initialAccounts`, `initialStrategies`, `initialTags`, `initialSettings` after the first Firestore load (when all 5 collections fire their first `onSnapshot`). Uses per-collection flags to only seed once.

## Screenshot uploads
Base64 screenshots (`url.startsWith('data:')`) are uploaded to Firebase Storage at `users/{uid}/trades/{tradeId}/{screenshotId}` before the Firestore trade document is written. The `storagePath` field is stored on the screenshot so it can be deleted when the trade is deleted.
