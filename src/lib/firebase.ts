import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  getFirestore,
} from 'firebase/firestore';

const defaultApiKey = "AIzaSyAUxWCugCsqtiD6wl-jqOpkwDuAQvirmZc";

// Firebase configuration with production defaults for Project: BatchMgt (batchmgt-6f7ad)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "batchmgt-6f7ad.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "batchmgt-6f7ad",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "batchmgt-6f7ad.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "116589525906",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:116589525906:web:ff570f04e47e0bc6b41f4b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W1LE2K8W06",
};

let app: any = null;
let db: Firestore | null = null;
let auth: any = null;
let googleProvider: GoogleAuthProvider | null = null;
let isFirebaseConfigured = false;

try {
  // Check if API key is not empty or demo placeholder
  const hasRealKey =
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('DEMO_KEY');

  if (hasRealKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    // Initialize Firestore with robust multi-tab offline persistence
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Fallback if already initialized
      db = getFirestore(app);
    }
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseConfigured = true;
    console.log('[NPB Firebase] Initialized with offline multi-tab persistence on project: batchmgt-6f7ad');
  } else {
    console.info('[NPB System] Running in local-offline storage mode. Add your Firebase keys in .env to sync with cloud Firestore.');
  }
} catch (err) {
  console.warn('[NPB Firebase] Firebase initialization skipped or failed. Falling back to local offline storage mode:', err);
}

export { app, db, auth, googleProvider, isFirebaseConfigured, firebaseConfig };
