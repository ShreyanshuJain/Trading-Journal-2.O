import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderKeyForLocalApplet123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trading-journal-f8d1a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trading-journal-f8d1a',
  // Keep the configured Realtime Database as a safe public fallback. Firebase
  // database URLs are not credentials, and this prevents the app from
  // initializing without a database when Vite has a stale env snapshot.
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://trading-journal-f8d1a-default-rtdb.asia-southeast1.firebasedatabase.app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'trading-journal-applet.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:demo1234567890',
};

// Prevent duplicate initialization (e.g. HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export default app;
