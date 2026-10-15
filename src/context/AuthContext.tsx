import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

interface AdminUser {
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
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          const adminObj: AdminUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Abdullah All Masum',
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
      const result = await signInWithPopup(auth, googleProvider);
      const adminObj: AdminUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
      setCurrentUser(adminObj);
      localStorage.setItem('npb_admin_session', JSON.stringify(adminObj));
    } else {
      // Offline fallback login
      devLoginAsAdmin();
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const adminObj: AdminUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Abdullah All Masum',
        photoURL: result.user.photoURL,
      };
      setCurrentUser(adminObj);
      localStorage.setItem('npb_admin_session', JSON.stringify(adminObj));
    } else {
      // Local check or default tutor login
      if (email.toLowerCase().includes('masum') || email.toLowerCase().includes('admin') || pass.length >= 4) {
        devLoginAsAdmin();
      } else {
        throw new Error('Invalid email or password.');
      }
    }
  };

  const devLoginAsAdmin = () => {
    const adminObj: AdminUser = {
      uid: 'admin-masum-dev-001',
      email: 'abdullahallmasum@npb.edu',
      displayName: 'Abdullah All Masum',
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: !!currentUser,
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
