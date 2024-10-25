import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../app/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token; // Extract token from cookies

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    // Process the request based on decodedToken, e.g., check user status
    return res.status(200).json({ uid: decodedToken.uid });
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
