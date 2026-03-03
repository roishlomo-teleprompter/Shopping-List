
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6gk3B0uFG3y7v4jhCWb9zzlPSmX0CjdU",
  authDomain: "shopping-list-218bd.firebaseapp.com",
  projectId: "shopping-list-218bd",
  storageBucket: "shopping-list-218bd.appspot.com",
  messagingSenderId: "883804592996",
  appId: "1:883804592996:web:61b0bb28cd02ef3961b871",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

/**
 * 🔥 Enable REAL offline support
 * Works across multiple tabs.
 */
enableMultiTabIndexedDbPersistence(db).catch((err: any) => {
  if (err?.code === "failed-precondition") {
    console.warn("Multiple tabs open, offline persistence limited.");
  } else if (err?.code === "unimplemented") {
    console.warn("Browser does not support offline persistence.");
  } else {
    console.warn("Firestore persistence error:", err);
  }
});
