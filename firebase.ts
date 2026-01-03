
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Ensure all values are correctly filled from your Firebase Console
const firebaseConfig = {
  apiKey: [.env.local]VITE_FIREBASE_API_KEY,
  authDomain: "pizza-pro-tafuri.firebaseapp.com",
  projectId: "pizza-pro-tafuri",
  storageBucket: "pizza-pro-tafuri.firebasestorage.app",
  messagingSenderId: "744087680274",
  appId: "1:744087680274:web:2ea28748ba6ec4b12fefcb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
