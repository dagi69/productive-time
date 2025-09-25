// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGMkaoA_gyRsPvPye0k-z0WRrAS7Xk-gM",
  authDomain: "productive-time-13ce8.firebaseapp.com",
  projectId: "productive-time-13ce8",
  storageBucket: "productive-time-13ce8.firebasestorage.app",
  messagingSenderId: "470397183987",
  appId: "1:470397183987:web:b075dce594086b186ad486",
  measurementId: "G-JSSV558SF9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
