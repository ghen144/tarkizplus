// firebase.js
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // For Authentication

export const firebaseConfig = {
    apiKey: "AIzaSyCV7eEVexbJeZ4Z8zCLQB-EwfneQnN-2xU",
    authDomain: "tarkizplus-bb553.firebaseapp.com",
    projectId: "tarkizplus-bb553",
    storageBucket: "tarkizplus-bb553.firebasestorage.app",
    messagingSenderId: "62542653443",
    appId: "1:62542653443:web:0045dd8736d784d4cc8636"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app); // Export the Firestore instance

// Initialize Authentication
export const auth = getAuth(app);

