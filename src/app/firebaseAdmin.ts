// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

export default admin;
export const db = admin.firestore();
export const verifyIdToken = async (idToken: string) => {
  return await admin.auth().verifyIdToken(idToken);
};


