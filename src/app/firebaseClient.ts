import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp: FirebaseApp;
let analytics: Analytics | undefined;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(firebaseApp);
  }
} else {
  firebaseApp = getApps()[0];
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(firebaseApp);
  }
}

export const firebaseAnalytics = {
  logPageView: (pagePath: string) => {
    if (typeof window !== 'undefined' && analytics) {
      logEvent(analytics, 'page_view', { page_path: pagePath });
    }
  },
};

const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);

export { auth, db };

export const createUserSettings = async (user: User) => {
  const userDocRef = doc(db, "users", user.email ?? "");
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      credits: 5,
      membershipLevel: 'Free',
      membership_start: null,
      lastCreditReset: new Date()
    });
    console.log("User settings created with default membership level: Free and membership_start: null");
  } else {
    console.log("User settings already exist. No changes made.");
  }
};

export const addFeedback = async (user: User) => {
  const userDocRef = doc(db, "feedbacks", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      email: user.email,
      isPremium: false,
    });
    console.log("Feedback added for user");
  }
};

export const reduceUserCredit = async (userEmail: string) => {
  try {
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentCredits = userDoc.data().credits;

      if (currentCredits > 0) {
        await updateDoc(userDocRef, { credits: currentCredits - 1 });
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
    } else {
      console.log('User document does not exist');
    }
  } catch (error) {
    console.error('Error updating membership level:', error);
  }
};

export const checkAndUpdateMembership = async (userEmail: string) => {
  if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
    console.error("Invalid userEmail provided. Ensure it is a valid non-empty email address.");
    return;
  }

  console.log(`Checking membership for userEmail: ${userEmail}`);

  try {
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const membershipStart = userData.membership_start;

      if (membershipStart) {
        const startDate = new Date(membershipStart);
        const currentDate = new Date();

        const diffInDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffInDays > 30) {
          await updateDoc(userDocRef, {
            membershipLevel: "Free",
            membership_start: null,
          });
          console.log(`Membership expired. Updated to Free membership.`);
        } else {
          console.log(`Membership is active. Days remaining: ${30 - diffInDays}`);
        }
      } else {
        console.log(`No membership start date found. Assuming default Free membership.`);
      }
    } else {
      console.log(`User document does not exist for email: ${userEmail}`);
    }
  } catch (error) {
    console.error(`Error checking and updating membership for userEmail: ${userEmail}`, error);
  }
};

interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userImage?: string;
  content: string;
  timestamp: Date;
  votes: number;
  replies?: Comment[];
  parentId?: string;
}

export interface PostInteraction {
  comments: Comment[];
  votes: { 
    [userId: string]: {
      type: 'up' | 'down';
      timestamp: Date;
    }
  };
  totalVotes: number;
}

export const addCommentToPost = async (
  postUrl: string, 
  comment: Omit<Comment, 'id' | 'timestamp' | 'votes' | 'replies'>
) => {
  try {
    const postDocRef = doc(db, "postInteractions", encodeURIComponent(postUrl));
    const postDoc = await getDoc(postDocRef);
    
    const newComment: Comment = {
      ...comment,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      votes: 0,
      replies: []
    };

    if (postDoc.exists()) {
      const data = postDoc.data() as PostInteraction;
      let comments = [...data.comments];
      
      if (comment.parentId) {
        // Add reply to parent comment
        comments = comments.map(c => {
          if (c.id === comment.parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment]
            };
          }
          return c;
        });
      } else {
        // Add new top-level comment
        comments.push(newComment);
      }
      
      await updateDoc(postDocRef, { comments });
    } else {
      await setDoc(postDocRef, {
        comments: [newComment],
        votes: {},
        totalVotes: 0
      });
    }

    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};
