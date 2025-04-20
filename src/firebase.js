import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDvJHDK_Mn2xOeW739_VYRTJ4nJEYCgK7Q",
    authDomain: "react-chat-room-app.firebaseapp.com",
    projectId: "react-chat-room-app",
    storageBucket: "react-chat-room-app.firebasestorage.app",
    messagingSenderId: "230525867511",
    appId: "1:230525867511:web:c7d2df36c108246b5e4af2",
    measurementId: "G-JF77ZWVSE3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };