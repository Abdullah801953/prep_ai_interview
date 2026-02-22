// Import the functions you need from the SDKs you need
import { initializeApp,getApp,getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyBHeuK2W6h_0f9A7-dywXdVNT1FGaOCRM8",

  authDomain: "prepwise-7da5f.firebaseapp.com",

  projectId: "prepwise-7da5f",

  storageBucket: "prepwise-7da5f.firebasestorage.app",

  messagingSenderId: "755296363604",

  appId: "1:755296363604:web:53e7f67148aa6c096739c1",

  measurementId: "G-69EST3Q8YX"

};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 