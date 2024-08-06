// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBf_ZMsrohXnRUxKxGJEufbBoA57ZdgEB8",
    authDomain: "inventory-management-8fba6.firebaseapp.com",
    projectId: "inventory-management-8fba6",
    storageBucket: "inventory-management-8fba6.appspot.com",
    messagingSenderId: "808438345251",
    appId: "1:808438345251:web:159ebfc54928ae432f0b96",
    measurementId: "G-EDE9NXNXHW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}