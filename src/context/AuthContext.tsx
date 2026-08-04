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
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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
      console.error('Firebase auth error:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // user dismissed, no error shown
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase. Add it to Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError('Network error. Check your internet connection and try again.');
      } else {
        setAuthError(`Sign-in failed (${err.code ?? 'unknown'}). Check the browser console for details.`);
      }
    }
  };

  const logout = async () => {
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
        logout,
        authError,
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
