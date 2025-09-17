// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
   apiKey: "AIzaSyCkRSwRNewCa7cM2Jsy7BS2_H1vsGn9LrA",
  authDomain: "school-e09a3.firebaseapp.com",
  projectId: "school-e09a3",
  storageBucket: "school-e09a3.firebasestorage.app",
  messagingSenderId: "947420810827",
  appId: "1:947420810827:web:5e32d61e675df1188c87ce",
  measurementId: "G-8KKP4YN9N0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

// Foydalanuvchi tokenini olish
export const requestPermission = async () => {
  try {
    const token = await getToken(messaging, { vapidKey: "AIzaSyCkRSwRNewCa7cM2Jsy7BS2_H1vsGn9LrA" });
    console.log("Foydalanuvchi FCM tokeni:", token);
    return token;
  } catch (err) {
    console.error("Token olishda xatolik:", err);
  }
};
