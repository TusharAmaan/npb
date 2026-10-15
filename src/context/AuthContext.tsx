import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export const PRIMARY_ADMIN_EMAIL = 'tushar.aman05@gmail.com';

export const isAuthorizedAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;

  // Additional admin emails configured in environment
  const extraAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  return extraAdmins.includes(normalized);
};

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDevAdmin?: boolean;
}

interface AuthContextType {
  currentUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  devLoginAsAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    // Check local session
    const saved = localStorage.getItem('npb_admin_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isDevAdmin || isAuthorizedAdmin(parsed.email)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          if (!isAuthorizedAdmin(user.email)) {
            console.warn(`[NPB Security] Blocked unauthorized login attempt by: ${user.email}`);
            await firebaseSignOut(auth);
            setCurrentUser(null);
            localStorage.removeItem('npb_admin_session');
            setIsLoading(false);
            return;
          }

          const adminObj: AdminUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Tushar Aman',
            photoURL: user.photoURL,
          };
          setCurrentUser(adminObj);
          localStorage.setItem('npb_admin_session', JSON.stringify(adminObj));
        } else {
          // If no dev session active, clear
          if (!currentUser?.isDevAdmin) {
            setCurrentUser(null);
            localStorage.removeItem('npb_admin_session');
          }
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [currentUser?.isDevAdmin]);

  const signInGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const userEmail = result.user.email;

        // STRICT ACCESS CONTROL: Only tushar.aman05@gmail.com allowed
        if (!isAuthorizedAdmin(userEmail)) {
          await firebaseSignOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('npb_admin_session');
          throw new Error(
            `Access Denied: "${userEmail}" is not authorized. Only ${PRIMARY_ADMIN_EMAIL} has administrator access.`
          );
        }

        const adminObj: AdminUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Tushar Aman',
          photoURL: result.user.photoURL,
        };
        setCurrentUser(adminObj);
        localStorage.setItem('npb_admin_session', JSON.stringify(adminObj));
      } catch (err: any) {
        if (err?.code === 'auth/unauthorized-domain') {
          throw new Error(
            `Firebase Domain Not Authorized: Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
          );
        }
        throw err;
      }
    } else {
      // Offline fallback login for development
      devLoginAsAdmin();
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    if (!isAuthorizedAdmin(email)) {
      throw new Error(
        `Access Denied: "${email}" is not authorized. Only ${PRIMARY_ADMIN_EMAIL} has administrator access.`
      );
    }

    if (isFirebaseConfigured && auth) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        const adminObj: AdminUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Tushar Aman',
          photoURL: result.user.photoURL,
        };
        setCurrentUser(adminObj);
        localStorage.setItem('npb_admin_session', JSON.stringify(adminObj));
      } catch (err: any) {
        if (err?.code === 'auth/unauthorized-domain') {
          throw new Error(
            `Firebase Domain Not Authorized: Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
          );
        }
        throw err;
      }
    } else {
      // Local dev check
      if (isAuthorizedAdmin(email) && pass.length >= 4) {
        devLoginAsAdmin();
      } else {
        throw new Error('Invalid email or password.');
      }
    }
  };

  const devLoginAsAdmin = () => {
    const adminObj: AdminUser = {
      uid: 'admin-tushar-dev-001',
      email: PRIMARY_ADMIN_EMAIL,
      displayName: 'Tushar Aman (Admin)',
      photoURL: null,
      isDevAdmin: true,
    };
    setCurrentUser(adminObj);
    localStorage.setItem('npb_admin_session', JSON.stringify(adminObj));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('npb_admin_session');
  };

  const isAdmin = !!currentUser && (currentUser.isDevAdmin === true || isAuthorizedAdmin(currentUser.email));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoading,
        signInGoogle,
        signInEmail,
        devLoginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
