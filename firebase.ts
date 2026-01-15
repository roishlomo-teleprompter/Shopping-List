
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "PLACEHOLDER",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "PLACEHOLDER",
  projectId: process.env.FIREBASE_PROJECT_ID || "PLACEHOLDER",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "PLACEHOLDER",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER",
  appId: process.env.FIREBASE_APP_ID || "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
