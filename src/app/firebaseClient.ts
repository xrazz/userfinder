// lib/firebaseClient.ts
import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// firebaseClientConfig.ts
export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};


// Ensure the app is initialized only once
let firebaseApp: FirebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0]; // If already initialized, use the existing app
}

 
const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);

export { auth, db };

export const createUserSettings = async (user: User) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // If user document does not exist, create one
    await setDoc(userDocRef, {
      email: user.email,
      isPremium: false, // Set default values
      credits:3,
      bookmarks:[],
      
      // ... add any other default settings you want
    });
  }
};

export const addfeedback = async (user: User) => {
  const userDocRef = doc(db, "feedbacks", user.uid);
  const userDoc = await getDoc(userDocRef);
console.log('im here ')
  if (!userDoc.exists()) {
    // If user document does not exist, create one
    await setDoc(userDocRef, {
      email: user.email,
      isPremium: false, // Set default values
      // ... add any other default settings you want
    });
  }
};