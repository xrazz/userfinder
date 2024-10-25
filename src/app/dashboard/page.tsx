import { cookies } from "next/headers";
import DashboardUI from "./dashboardUI";
import admin, { db } from "../firebaseAdmin";
import { redirect } from "next/navigation";
 

export default async function Dashboard() {
  let isPremiumCheck = false;
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
      const userSnapshot = await db.collection('users').doc(userId).get();

      if (!userSnapshot.exists) {
        console.log('No user found with this UID');
        return null;
      }

      const userData = userSnapshot.data() ?? {};
      isPremiumCheck = userData['isPremium'] ?? false; // Default to false if undefined

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
    redirect('/login');
  }

  return (
    
    <DashboardUI
      isPremium={isPremiumCheck}
      profileurl={profilePhoto}
      profileName={profileName}
      profileEmail={profileEmail}
      uid={userId}
    />
     
  );
}
