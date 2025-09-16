// src/firebase/firebase.jsx

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase konsolida olingan o'z konfiguratsiya ma'lumotlaringizni kiriting.
const firebaseConfig = {
   apiKey: "AIzaSyCkRSwRNewCa7cM2Jsy7BS2_H1vsGn9LrA",
  authDomain: "school-e09a3.firebaseapp.com",
  projectId: "school-e09a3",
  storageBucket: "school-e09a3.firebasestorage.app",
  messagingSenderId: "947420810827",
  appId: "1:947420810827:web:5e32d61e675df1188c87ce",
  measurementId: "G-8KKP4YN9N0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };