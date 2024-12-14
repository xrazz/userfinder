export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import admin, { db } from "./firebaseAdmin";
import SearchUI from "./searchUI";

const MEMBERSHIP_LEVELS = {
  FREE: 'Free',
  BASIC: 'Basic',
  PRO: 'Pro'
};


export default async function Dashboard() {
  let membership = MEMBERSHIP_LEVELS.FREE;
  let profilePhoto = '';
  let profileName = '';
  let profileEmail = '';
  let userId = '';

  const getUserInfo = async () => {
    try {
      // Get the token from cookies
      const cookieStore = cookies();
      const token = cookieStore.get('token')?.value;

      if (!token) return null; // No token means the user is not logged in

      // Verify the token using Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);
      userId = decodedToken.uid;
      profilePhoto = decodedToken.picture ?? '';
      profileName = decodedToken.name;
      profileEmail = decodedToken.email ?? '';

      // Fetch the user's data from Firestore using the decoded token's UID
      const userSnapshot = await db.collection('users').doc(profileEmail).get();

      if (!userSnapshot.exists) {
        console.log('No user found with this UID');
        return null;
      }

      const userData = userSnapshot.data() ?? {};
      membership = userData['membershipLevel']??MEMBERSHIP_LEVELS.FREE;
      // isPremiumCheck = userData['isPremium'] ?? false; // Default to false if undefined

      return true; // User is logged in and info fetched successfully
    } catch (error) {
      console.error('Error verifying token or fetching user data:', error);
      return false; // Return false if there's an error
    }
  };

  // Fetch user information and check if logged in
  const loggedIn = await getUserInfo();

  if (!loggedIn) {
    // If the user is not logged in, redirect to login page
    // redirect('/login');
  }

  return (
    <SearchUI Membership={membership}
    imageUrl={profilePhoto}
    name={profileName}
    email={profileEmail}
    userId={userId} />
    
     
  );
}