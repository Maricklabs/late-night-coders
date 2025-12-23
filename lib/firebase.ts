// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  updateDoc, 
  increment, 
  setDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Singleton pattern for Next.js hot-reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// --- GLOBAL STAT TRACKER HELPER ---
// Call this function from any page to update the user's stats in Firestore
export const incrementStat = async (userId: string, field: string) => {
  if (!userId) return;
  
  const statsRef = doc(db, "user_stats", userId);
  const todayStr = new Date().toLocaleDateString();
  
  try {
    // Try to update existing document
    await updateDoc(statsRef, {
      [field]: increment(1)
      // NOTE: We REMOVED 'lastVisit' here.
      // We let the Tracker page handle the daily streak logic to prevent conflicts.
    });
  } catch (error) {
    // If document doesn't exist (First time ever), create it
    await setDoc(statsRef, {
        chats: 0, 
        readmes: 0, 
        tasks: 0, 
        breaks: 0, 
        typetests: 0, 
        daysUsed: 1,
        [field]: 1, 
        lastVisit: todayStr // Initial setup is fine
    }, { merge: true });
  }
};