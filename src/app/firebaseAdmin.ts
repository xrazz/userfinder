// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';
console.log("test:", process.env.testVariable);
console.log("FIREBASE client:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "[HIDDEN]" : "NOT FOUND");

const privateKey: string = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

export default admin;
export const db = admin.firestore();
 
export const verifyIdToken = async (idToken: string) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
};




 
