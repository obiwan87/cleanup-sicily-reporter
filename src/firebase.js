// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';



// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA07pGcJuoySY9hk6-x78-nGEekKQ8qhO8",
    authDomain: "cleanup-sicily.firebaseapp.com",
    projectId: "cleanup-sicily",
    storageBucket: "cleanup-sicily.firebasestorage.app",
    messagingSenderId: "1071562468865",
    appId: "1:1071562468865:web:5fda8dfa86f6d7ef375a00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth();

signInAnonymously(auth)
    .then(() => {
        console.log('Signed in anonymously');
    })
    .catch((error) => {
        console.error('Anonymous sign-in failed', error);
    });

// Optional — listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Authenticated as UID:', user.uid);
    }
});
export {app}