 
import React from 'react'
import CheckoutPage from './Ui';
import { redirect } from 'next/navigation';
import admin from '../firebaseAdmin';
import { cookies } from 'next/headers';
const PLANS = {
  BASIC: 10,
  PRO: 29
};
const FEATURES = {
  BASIC:  [
    "Unlimited searches per month",
    "Search across popular platforms (Reddit, Quora, Twitter, etc.)",
    "Max 10 results per search",
    "Access to date filters for recent conversations",
    "Pre-made prompts for validation & research",
  ],
  PRO:[
    "Custom domain crawling (e.g., Facebook, LinkedIn, or your own websites)",
    "50 results per search",
    "Dedicated support for feature requests",
    "Ideal for market validation and targeting niche communities",
  ]
};
 
interface Props {
  searchParams: { plan?: string };
}
const Payment = async ({ searchParams }: Props) => {
  const plan = searchParams.plan; // Extract the query parameter

  if (!plan || !['BASIC', 'PRO'].includes(plan)) {
    redirect('/'); // Redirect if the plan is invalid
  }

  let email = ''
    const isUserLoggedIn = async (): Promise<boolean> => {
        try {

            const cookieStore = cookies();
            const token = cookieStore.get('token')?.value;

            if (!token) return false; // No token means the user is not logged in


            const decodedToken = await admin.auth().verifyIdToken(token);
            email = decodedToken.email ?? '';
            // console.log(decodedToken.name)
            // console.log(decodedToken.email)
            return !!decodedToken;
        } catch (error) {
            console.error('Error verifying token:', error);
            // If verification fails, return false (user is not logged in)
            return false;
        }
    };
    const loggedIn = await isUserLoggedIn();
    if (!loggedIn) {
        redirect('/login')

    }
  console.log(plan)
 
  return (
    <div>
       <CheckoutPage amount={plan==="BASIC"?PLANS.BASIC:PLANS.PRO} mail={email} features={plan==="BASIC"?FEATURES.BASIC:FEATURES.PRO}/>
    </div>
  )
}

export default Payment
