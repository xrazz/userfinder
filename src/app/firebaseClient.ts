// lib/firebaseClient.ts
import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, updateDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
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
  const userDocRef = doc(db, "users", user.email ?? "");
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Creating a new document with default membership level 'Free' for new users
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      credits: 11,
      membershipLevel: 'Free', // Set default membership level
      membership_start: null,  // Initialize membership start date as null
    });
    console.log("User settings created with default membership level: Free and membership_start: null");
  } else {
    console.log("User settings already exist. No changes made.");
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

export const reduceUserCredit = async (userEmail:string) => {
  try {
    // Reference the user's document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentCredits = userDoc.data().credits;

      if (currentCredits > 0) {
        // Reduce credits by 1
        await updateDoc(userDocRef, {
          credits: currentCredits - 1
        });
        console.log(`Credit reduced! New credit count: ${currentCredits - 1}`);
      } else {
        console.log('No credits remaining');
      }
    } else {
      console.log('User document does not exist');
    }
  } catch (error) {
    console.error('Error reducing credit:', error);
  }
};

export const updateMembershipLevel = async (userEmail: string, newMembershipLevel: string) => {
  console.log(userEmail, newMembershipLevel);
  try {
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const membershipStart = userData.membership_start || null;

      await updateDoc(userDocRef, {
        membershipLevel: newMembershipLevel,
        membership_start: membershipStart === null ? new Date().toISOString() : membershipStart,
      });

      console.log(`Membership level updated to: ${newMembershipLevel}`);
      console.log(
        membershipStart === null
          ? `Membership started on: ${new Date().toISOString()}`
          : `Membership start date remains unchanged: ${membershipStart}`
      );
    } else {
      console.log('User document does not exist');
    }
  } catch (error) {
    console.error('Error updating membership level:', error);
  }
};






// export const checkAndUpdateMembership = async (userEmail: string) => {
//   console.log(`Checking membership for: ${userEmail}`);
//   try {
//     const userDocRef = doc(db, "users", userEmail);
//     const userDoc = await getDoc(userDocRef);

//     if (userDoc.exists()) {
//       const userData = userDoc.data();
//       const membershipStart = userData.membership_start;

//       if (membershipStart) {
//         const startDate = new Date(membershipStart);
//         const currentDate = new Date();

//         // Calculate the difference in minutes for testing
//         const diffInMinutes = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60));
//         console.log(`Membership start date: ${startDate.toISOString()}`);
//         console.log(`Minutes since membership start: ${diffInMinutes}`);

//         // Check if membership is older than 1 minute for testing
//         if (diffInMinutes > 1) {
//           // Update membership level to 'Free'
//           await updateDoc(userDocRef, {
//             membershipLevel: "Free",
//             membership_start: null, // Reset membership_start
//           });

//           console.log(`Membership level updated to: Free`);
//         } else {
//           console.log(`Membership is still active. Minutes remaining: ${1 - diffInMinutes}`);
//         }
//       } else {
//         console.log(`No membership start date found. Assuming default Free membership.`);
//       }
//     } else {
//       console.log(`User document does not exist.`);
//     }
//   } catch (error) {
//     console.error(`Error checking and updating membership:`, error);
//   }
// };

export const checkAndUpdateMembership = async (userEmail: string) => {
  console.log(`Checking membership for: ${userEmail}`);
  try {
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const membershipStart = userData.membership_start;

      if (membershipStart) {
        const startDate = new Date(membershipStart);
        const currentDate = new Date();

        // Calculate the difference in days
        const diffInDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`Membership start date: ${startDate.toISOString()}`);
        console.log(`Days since membership start: ${diffInDays}`);

        // Check if membership is older than 30 days
        if (diffInDays > 30) {
          // Update membership level to 'Free'
          await updateDoc(userDocRef, {
            membershipLevel: "Free",
            membership_start: null, // Reset membership_start
          });

          console.log(`Membership level updated to: Free`);
        } else {
          console.log(`Membership is still active. Days remaining: ${30 - diffInDays}`);
        }
      } else {
        console.log(`No membership start date found. Assuming default Free membership.`);
      }
    } else {
      console.log(`User document does not exist.`);
    }
  } catch (error) {
    console.error(`Error checking and updating membership:`, error);
  }
};
