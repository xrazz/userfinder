export const dynamic = "force-dynamic";  
import { cookies } from 'next/headers';
import CheckoutForm from './CheckoutForm'
import admin from '../firebaseAdmin';
import { redirect } from 'next/navigation';
 


 
export default async function CheckoutPage() {
   
    const isUserLoggedIn = async (): Promise<boolean> => {
        try {

            const cookieStore = cookies();
            const token = cookieStore.get('token')?.value;

            if (!token) return false; // No token means the user is not logged in


            const decodedToken = await admin.auth().verifyIdToken(token);

            console.log(decodedToken.name)



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

    return (
        <div className="container mx-auto px-4 py-8">

            <CheckoutForm />
        </div>
    )
}
