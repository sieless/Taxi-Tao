import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAcTAQAmZE28Ccn0N8_SbNlLFB2d9YqE7k",
  authDomain: "studio-6444216032-ee9f7.firebaseapp.com",
  projectId: "studio-6444216032-ee9f7",
  storageBucket: "studio-6444216032-ee9f7.firebasestorage.app",
  messagingSenderId: "442419181015",
  appId: "1:442419181015:web:096ac4a76991daa5b48792"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
