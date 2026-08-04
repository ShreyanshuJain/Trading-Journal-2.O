---
name: Firebase Realtime Database architecture
description: How the Trading Journal persists authenticated users and journal data in Firebase Realtime Database
---

## Rule
All journal data is stored below `users/{uid}` in Firebase Realtime Database. Google authentication remains Firebase Auth, and screenshots remain Firebase Storage. The Realtime Database URL is `trading-journal-f8d1a-default-rtdb.asia-southeast1.firebasedatabase.app`.

**Why:** The project has a Firebase Realtime Database provisioned in Singapore, while the Firestore default database was not provisioned. Keeping the existing Google login and switching the data adapter avoids requiring a second database service.

**How to apply:** Use the project’s Realtime Database adapter for reads and writes. Keep the authenticated UID in every path and apply `database.rules.json` in Firebase Console so users can only access their own `users/{uid}` branch.

## Computed account balance
`currentBalance` is derived in React from each account’s `startingBalance` plus its trades’ `netPL`; it is not persisted. This prevents circular real-time updates.