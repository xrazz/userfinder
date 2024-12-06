export const dynamic = "force-dynamic";

import LoginUI from "./ui/loginUI";
import admin from "../firebaseAdmin";
import { redirect } from 'next/navigation';
import { cookies } from "next/headers";

const signIn = async () => {

  const isUserLoggedIn = async (): Promise<boolean> => {
    try {
      const cookieStore = cookies();
      const token = cookieStore.get('token')?.value;

      if (!token) return false; // No token means the user is not logged in

      // Verify the token with Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);

      // If verification passes, return true (user is logged in)
      return !!decodedToken;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  };

  const loggedIn = await isUserLoggedIn();

  if (loggedIn) {
    redirect('/'); // Redirect to dashboard if logged in
  } else {
    console.log('User not logged in');
  }

  return (
    <div>
      <LoginUI />
    </div>
  );
}

export default signIn;
