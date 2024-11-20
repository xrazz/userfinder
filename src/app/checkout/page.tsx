export const dynamic = "force-dynamic";
import { cookies } from 'next/headers';
import CheckoutForm from './CheckoutForm'
import admin, { db } from '../firebaseAdmin';
import { redirect } from 'next/navigation';



const MEMBERSHIP_LEVELS = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Pro'
};
export default async function CheckoutPage() {
    let profileEmail = '';
    let membership = MEMBERSHIP_LEVELS.FREE;
    const isUserLoggedIn = async (): Promise<boolean> => {
        try {

            const cookieStore = cookies();
            const token = cookieStore.get('token')?.value;

            if (!token) return false; // No token means the user is not logged in


            const decodedToken = await admin.auth().verifyIdToken(token);


            profileEmail = decodedToken.email ?? '';

            // Fetch the user's data from Firestore using the decoded token's UID
            const userSnapshot = await db.collection('users').doc(profileEmail).get();

            if (!userSnapshot.exists) {
                console.log('No user found with this UID');
                //   return null;
            }

            const userData = userSnapshot.data() ?? {};
            membership = userData['membershipLevel'] ?? MEMBERSHIP_LEVELS.FREE;


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

    if (membership === MEMBERSHIP_LEVELS.PRO) {
        redirect('/search')
    }

    return (
        <div className="container mx-auto px-4 py-8">

            <CheckoutForm />
        </div>
    )
}