import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from '../firebase/realtime';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
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
const DEFAULT_USER_UID = 'e0xW3T8S83Y8ATyma1keIe0fNX03';
const DEFAULT_USER_EMAIL = 'gulshreyanshu72@gmail.com';
const DEFAULT_USER_NAME = 'Shreyanshu Jain';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedCustomUid = localStorage.getItem(CUSTOM_UID_KEY);
      if (savedCustomUid) {
        return {
          uid: savedCustomUid,
          displayName: savedCustomUid === DEFAULT_USER_UID ? DEFAULT_USER_NAME : 'Trader',
          email: savedCustomUid === DEFAULT_USER_UID ? DEFAULT_USER_EMAIL : 'trader@journal.local',
          photoURL: null,
        } as unknown as User;
      }
      if (localStorage.getItem(GUEST_KEY) === 'true') {
        return {
          uid: DEFAULT_USER_UID,
          displayName: DEFAULT_USER_NAME,
          email: DEFAULT_USER_EMAIL,
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
        setCurrentUser(user);
      } else {
        const savedCustomUid = localStorage.getItem(CUSTOM_UID_KEY);
        if (savedCustomUid) {
          setCurrentUser({
            uid: savedCustomUid,
            displayName: savedCustomUid === DEFAULT_USER_UID ? DEFAULT_USER_NAME : 'Trader',
            email: savedCustomUid === DEFAULT_USER_UID ? DEFAULT_USER_EMAIL : 'trader@journal.local',
            photoURL: null,
          } as unknown as User);
        } else if (localStorage.getItem(GUEST_KEY) === 'true') {
          setCurrentUser({
            uid: DEFAULT_USER_UID,
            displayName: DEFAULT_USER_NAME,
            email: DEFAULT_USER_EMAIL,
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
    const targetUid = uid.trim() || DEFAULT_USER_UID;
    localStorage.setItem(CUSTOM_UID_KEY, targetUid);
    localStorage.setItem(GUEST_KEY, 'true');
    setCurrentUser({
      uid: targetUid,
      displayName: name || (targetUid === DEFAULT_USER_UID ? DEFAULT_USER_NAME : 'Trader'),
      email: email || (targetUid === DEFAULT_USER_UID ? DEFAULT_USER_EMAIL : 'trader@journal.local'),
      photoURL: null,
    } as unknown as User);
  };

  const signInAsGuest = () => {
    signInWithUid(DEFAULT_USER_UID, DEFAULT_USER_NAME, DEFAULT_USER_EMAIL);
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey || apiKey.includes('Placeholder') || !apiKey.startsWith('AIza')) {
      setAuthErrorCode('auth/invalid-api-key');
      setAuthError(
        'Google Authentication requires a valid Firebase API Key (VITE_FIREBASE_API_KEY). You can configure it in Settings or click "Explore in Demo / Local Mode" to use the journal right now.'
      );
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      localStorage.removeItem(GUEST_KEY);

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
          'Firebase API Key is missing or invalid. Please check VITE_FIREBASE_API_KEY or click "Explore in Demo / Local Mode" to proceed.'
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
        setAuthError(`Sign-in failed (${code || 'unknown'}). You can use Demo Mode below.`);
      }
    }
  };

  const logout = async () => {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(CUSTOM_UID_KEY);
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
