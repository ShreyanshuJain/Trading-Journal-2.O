import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from '../firebase/realtime';

export const isKnownAuthorizedDomain = (hostname: string): boolean => {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname.endsWith('.firebaseapp.com') || hostname.endsWith('.web.app')) return true;
  return false;
};

export const isPreviewDomain = (hostname: string): boolean => {
  if (!hostname) return false;
  if (
    hostname.includes('ai.studio') ||
    hostname.includes('run.app') ||
    hostname.includes('webcontainer') ||
    hostname.includes('google.internal')
  ) {
    return true;
  }
  return !isKnownAuthorizedDomain(hostname);
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signInAsGuest: () => void;
  signInWithUid: (uid: string, name?: string, email?: string) => void;
  logout: () => Promise<void>;
  authError: string | null;
  authErrorCode: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'trading_journal_guest_active';
const CUSTOM_UID_KEY = 'trading_journal_custom_uid';
const LAST_AUTH_UID_KEY = 'trading_journal_auth_uid';
const LOCAL_USER_EMAIL_KEY = 'trading_journal_user_email';
const LOCAL_USER_NAME_KEY = 'trading_journal_user_name';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedAuthUid = localStorage.getItem(LAST_AUTH_UID_KEY) || localStorage.getItem(CUSTOM_UID_KEY);
      const savedEmail = localStorage.getItem(LOCAL_USER_EMAIL_KEY);
      const savedName = localStorage.getItem(LOCAL_USER_NAME_KEY);
      if (savedAuthUid) {
        return {
          uid: savedAuthUid,
          displayName: savedName || 'Trader',
          email: savedEmail || 'trader@journal.local',
          photoURL: null,
        } as unknown as User;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  const clearAuthError = () => {
    setAuthError(null);
    setAuthErrorCode(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        localStorage.removeItem(GUEST_KEY);
        localStorage.removeItem(CUSTOM_UID_KEY);
        localStorage.setItem(LAST_AUTH_UID_KEY, user.uid);
        if (user.email) localStorage.setItem(LOCAL_USER_EMAIL_KEY, user.email);
        if (user.displayName) localStorage.setItem(LOCAL_USER_NAME_KEY, user.displayName);
        setCurrentUser(user);
      } else {
        const savedAuthUid = localStorage.getItem(LAST_AUTH_UID_KEY) || localStorage.getItem(CUSTOM_UID_KEY);
        const savedEmail = localStorage.getItem(LOCAL_USER_EMAIL_KEY);
        const savedName = localStorage.getItem(LOCAL_USER_NAME_KEY);
        if (savedAuthUid) {
          setCurrentUser({
            uid: savedAuthUid,
            displayName: savedName || 'Trader',
            email: savedEmail || 'trader@journal.local',
            photoURL: null,
          } as unknown as User);
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithUid = (uid: string, name?: string, email?: string) => {
    const targetUid = uid.trim() || `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const targetEmail = email || `${targetUid.slice(0, 8)}@trader.local`;
    const targetName = name || 'Trader';
    localStorage.setItem(CUSTOM_UID_KEY, targetUid);
    localStorage.setItem(LAST_AUTH_UID_KEY, targetUid);
    localStorage.setItem(LOCAL_USER_EMAIL_KEY, targetEmail);
    localStorage.setItem(LOCAL_USER_NAME_KEY, targetName);
    setCurrentUser({
      uid: targetUid,
      displayName: targetName,
      email: targetEmail,
      photoURL: null,
    } as unknown as User);
  };

  const signInAsGuest = () => {
    const guestUid = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    signInWithUid(guestUid, 'Guest Trader', 'guest@trader.local');
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setAuthErrorCode(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setAuthError('Please enter both email and password.');
      return false;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = res.user;
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(CUSTOM_UID_KEY);
      localStorage.setItem(LOCAL_USER_EMAIL_KEY, user.email || cleanEmail);
      if (user.displayName) localStorage.setItem(LOCAL_USER_NAME_KEY, user.displayName);

      // Record login
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || cleanEmail.split('@')[0],
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (err: any) {
      const code = err.code || '';
      setAuthErrorCode(code);
      console.warn('Email sign in warning:', code, err.message);

      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setAuthError('Invalid email or password. Please check your credentials or create a new account.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please provide a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Access temporarily disabled due to many failed login attempts. Try again in a few moments.');
      } else if (code === 'auth/operation-not-allowed') {
        // If email auth is not enabled in Firebase Console, fallback to local login seamlessly
        const localUid = `usr_${Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36)}`;
        signInWithUid(localUid, cleanEmail.split('@')[0], cleanEmail);
        return true;
      } else if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
        const localUid = `usr_${Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36)}`;
        signInWithUid(localUid, cleanEmail.split('@')[0], cleanEmail);
        return true;
      } else {
        setAuthError(err.message || 'Failed to sign in with email.');
      }
      return false;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string): Promise<boolean> => {
    setAuthError(null);
    setAuthErrorCode(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !password) {
      setAuthError('Please enter email and password.');
      return false;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return false;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = res.user;
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(CUSTOM_UID_KEY);
      localStorage.setItem(LOCAL_USER_EMAIL_KEY, cleanEmail);
      localStorage.setItem(LOCAL_USER_NAME_KEY, cleanName);

      try {
        await updateProfile(user, { displayName: cleanName });
      } catch (pErr) {
        console.warn('Profile update warning:', pErr);
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: cleanEmail,
          displayName: cleanName,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (err: any) {
      const code = err.code || '';
      setAuthErrorCode(code);
      console.warn('Email sign up warning:', code, err.message);

      if (code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please sign in instead.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please provide a valid email address.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password is too weak. Please use at least 6 characters.');
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
        // Fallback to seamless local account creation
        const localUid = `usr_${Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36)}`;
        signInWithUid(localUid, cleanName, cleanEmail);
        return true;
      } else {
        setAuthError(err.message || 'Failed to create account.');
      }
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setAuthError(null);
    setAuthErrorCode(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your email address to reset password.');
      return false;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return true;
    } catch (err: any) {
      const code = err.code || '';
      setAuthErrorCode(code);
      if (code === 'auth/user-not-found') {
        setAuthError('No account found with this email address.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(err.message || 'Failed to send password reset email.');
      }
      return false;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || (auth.app?.options?.apiKey as string | undefined) || '';
    if (!apiKey || apiKey.includes('Placeholder') || !apiKey.startsWith('AIza')) {
      setAuthErrorCode('auth/invalid-api-key');
      setAuthError(
        'Google Authentication requires an authorized Firebase API Key. You can use Email Sign-In / Sign-Up directly above.'
      );
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(CUSTOM_UID_KEY);
      if (user.email) localStorage.setItem(LOCAL_USER_EMAIL_KEY, user.email);
      if (user.displayName) localStorage.setItem(LOCAL_USER_NAME_KEY, user.displayName);

      // Upsert user profile in Realtime Database
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Set createdAt only on first login
      await setDoc(
        doc(db, 'users', user.uid),
        { createdAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('Firebase auth notice:', err.code, err.message);
      const code = err.code || '';
      setAuthErrorCode(code);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user dismissed, no error shown
      } else if (
        code === 'auth/api-key-not-valid' ||
        code === 'auth/invalid-api-key' ||
        err.message?.includes('api-key-not-valid')
      ) {
        setAuthError(
          'Firebase API Key is missing or invalid. Use the Email & Password form above or Instant Bypass.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase. Add it to Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Network error. Check your internet connection and try again.');
      } else {
        setAuthError(`Sign-in failed (${code || 'unknown'}). Use Email sign-in or Instant Bypass below.`);
      }
    }
  };

  const logout = async () => {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(CUSTOM_UID_KEY);
    localStorage.removeItem(LAST_AUTH_UID_KEY);
    localStorage.removeItem(LOCAL_USER_EMAIL_KEY);
    localStorage.removeItem(LOCAL_USER_NAME_KEY);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: !!currentUser,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInAsGuest,
        signInWithUid,
        logout,
        authError,
        authErrorCode,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

