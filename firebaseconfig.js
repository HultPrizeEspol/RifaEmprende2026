// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0WibTVgelyF8BFpZVUEZKCwjjEwMdJuE",
  authDomain: "rifa2026-29924.firebaseapp.com",
  projectId: "rifa2026-29924",
  storageBucket: "rifa2026-29924.firebasestorage.app",
  messagingSenderId: "115371642210",
  appId: "1:115371642210:web:95ce7c30ba2f96c01a303b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);