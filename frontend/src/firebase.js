// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuBdnuHEz8gOV5-EOrRtLuJ0vlieToJuQ",
  authDomain: "cleanup-sicily-test.firebaseapp.com",
  projectId: "cleanup-sicily-test",
  storageBucket: "cleanup-sicily-test.firebasestorage.app",
  messagingSenderId: "328480662075",
  appId: "1:328480662075:web:015be50a66d2f0aff2721e"
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
