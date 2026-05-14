import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6gk3B0uFG3y7v4jhCWb9zzlPSmX0CjdU",
  authDomain: "shopping-list-218bd.firebaseapp.com",
  projectId: "shopping-list-218bd",
  storageBucket: "shopping-list-218bd.appspot.com",
  messagingSenderId: "883804592996",
  appId: "1:883804592996:web:61b0bb28cd02ef3961b871",
};

const app = initializeApp(firebaseConfig);

const isIosCapacitor =
  typeof window !== "undefined" &&
  window.location.protocol === "capacitor:";

export const auth = isIosCapacitor
  ? initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    })
  : getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);