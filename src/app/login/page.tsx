 

 

 
 
import LoginUI from "./ui/loginUI" 
 
import admin from "../firebaseAdmin";
import { redirect } from 'next/navigation';
 
import { cookies } from "next/headers";
 

 





 

const signIn = async () => {
 
 
  const isUserLoggedIn = async (): Promise<boolean> => {
    try {
      // Get the cookie named 'token' using Next.js cookies utility
      const cookieStore = cookies();
      const token = cookieStore.get('token')?.value;
  
      if (!token) return false; // No token means the user is not logged in
  
      // Verify the token with Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);
  
      // If verification passes, return true (user is logged in)
      return !!decodedToken;
    } catch (error) {
      console.error('Error verifying token:', error);
      // If verification fails, return false (user is not logged in)
      return false;
    }
  };

  const loggedIn = await isUserLoggedIn();

  if (loggedIn) {
    redirect('/dashboard')
    
  }
console.log('user login check' ,loggedIn)
  return (
    <div>
      <LoginUI/>
    </div>
  )
}

export default signIn

