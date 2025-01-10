'use client';

import { useEffect } from 'react';
import { trackReferral } from '../app/firebaseClient';

export default function ReferralTracker() {
  useEffect(() => {
    trackReferral();
  }, []);

  return null;
} 