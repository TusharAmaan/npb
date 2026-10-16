import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export const PRIMARY_ADMIN_EMAIL = 'tushar.aman05@gmail.com';

// STRICT ADMIN AUTHORIZATION: Only tushar.aman05@gmail.com is authorized
export const isAuthorizedAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
};

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  accessDeniedMessage: string | null;
  clearAccessDeniedMessage: () => void;
  signInGoogle: () => Promise<void>;
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
        if (isAuthorizedAdmin(parsed.email)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const clearAccessDeniedMessage = () => setAccessDeniedMessage(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          if (!isAuthorizedAdmin(user.email)) {
            console.warn(`[NPB Security] Blocked unauthorized login attempt by: ${user.email}`);
            await firebaseSignOut(auth);
            setCurrentUser(null);
            localStorage.removeItem('npb_admin_session');
            setAccessDeniedMessage(
              `Access Denied: "${user.email}" is not authorized. Only ${PRIMARY_ADMIN_EMAIL} has administrative access.`
            );
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
          setAccessDeniedMessage(null);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('npb_admin_session');
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const signInGoogle = async () => {
    setAccessDeniedMessage(null);
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        // Force account chooser so user can explicitly pick tushar.aman05@gmail.com
        googleProvider.setCustomParameters({
          prompt: 'select_account',
        });

        const result = await signInWithPopup(auth, googleProvider);
        const userEmail = result.user.email;

        // STRICT ACCESS CONTROL: Only tushar.aman05@gmail.com allowed
        if (!isAuthorizedAdmin(userEmail)) {
          await firebaseSignOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('npb_admin_session');
          const deniedMsg = `Access Denied: "${userEmail}" is not authorized. Only ${PRIMARY_ADMIN_EMAIL} has administrative access to this system.`;
          setAccessDeniedMessage(deniedMsg);
          throw new Error(deniedMsg);
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
        if (err?.code === 'auth/popup-closed-by-user') {
          throw new Error('Google Sign-In was closed before authentication finished.');
        }
        throw err;
      }
    } else {
      throw new Error(
        'Firebase Authentication is unavailable. Please verify internet connection and Firebase config.'
      );
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('npb_admin_session');
  };

  // STRICT: Only genuine authenticated tushar.aman05@gmail.com is admin
  const isAdmin = !!currentUser && isAuthorizedAdmin(currentUser.email);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoading,
        accessDeniedMessage,
        clearAccessDeniedMessage,
        signInGoogle,
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
