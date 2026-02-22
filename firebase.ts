import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6gk3B0uFG3y7v4jhCWb9zzlPSmX0CjdU",
  authDomain: "myeasylist.app",
  projectId: "shopping-list-218bd",
  storageBucket: "shopping-list-218bd.appspot.com",
  messagingSenderId: "883804592996",
  appId: "1:883804592996:web:61b0bb28cd02ef3961b871",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// חשוב: authReady מיוצא כי App.tsx מצפה לו
export const authReady = (async () => {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      await setPersistence(auth, inMemoryPersistence);
    }
  }
})();
