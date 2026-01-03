
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ensure all values are correctly filled from your Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string || "pizza-pro-tafuri.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string || "pizza-pro-tafuri",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string || "pizza-pro-tafuri.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string || "744087680274",
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string || "1:744087680274:web:2ea28748ba6ec4b12fefcb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
