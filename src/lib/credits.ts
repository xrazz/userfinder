import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebaseClient';
import Cookies from 'js-cookie';

interface CreditManager {
  getCredits: () => Promise<number>;
  reduceCredits: () => Promise<boolean>;
  resetDailyCredits: () => Promise<void>;
}

export class UserCreditManager implements CreditManager {
  private email: string;
  private defaultCredits: number;
  
  constructor(email: string, defaultCredits: number = 10) {
    this.email = email;
    this.defaultCredits = defaultCredits;
  }

  private async getUserDoc() {
    const userDocRef = doc(db, 'users', this.email);
    return await getDoc(userDocRef);
  }

  async getCredits(): Promise<number> {
    const docSnap = await this.getUserDoc();
    if (!docSnap.exists()) {
      await this.initializeUser();
      return this.defaultCredits;
    }
    return docSnap.data().credits || 0;
  }

  async reduceCredits(): Promise<boolean> {
    const userDocRef = doc(db, 'users', this.email);
    const docSnap = await this.getUserDoc();
    
    if (!docSnap.exists()) {
      await this.initializeUser();
      return true;
    }

    const currentCredits = docSnap.data().credits || 0;
    if (currentCredits <= 0) return false;

    await updateDoc(userDocRef, { credits: currentCredits - 1 });
    return true;
  }

  async resetDailyCredits(): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', this.email);
      const docSnap = await this.getUserDoc();
      
      if (!docSnap.exists()) {
        await this.initializeUser();
        return;
      }

      const userData = docSnap.data();
      const now = new Date();
      
      // Handle the last reset date
      let lastResetDate: Date | null = null;
      const lastReset = userData?.lastCreditReset;

      if (lastReset) {
        if (lastReset instanceof Timestamp) {
          lastResetDate = lastReset.toDate();
        } else if (lastReset instanceof Date) {
          lastResetDate = lastReset;
        } else if (typeof lastReset === 'string') {
          lastResetDate = new Date(lastReset);
        }
      }

      // Check if we need to reset credits
      const shouldReset = !lastResetDate || 
        lastResetDate.toDateString() !== now.toDateString();

      if (shouldReset) {
        const membershipLevel = userData?.membershipLevel || userData?.subscriptionPlan || 'Free';
        let creditsToSet = 10;

        // Normalize membership level to handle different cases
        const normalizedLevel = membershipLevel.toLowerCase();
        if (normalizedLevel === 'free') {
          creditsToSet = 5;
        } else if (normalizedLevel === 'pro' || normalizedLevel === 'basic') {
          creditsToSet = 50;
        }

        // If user has an active subscription, ensure they get Pro credits
        if (userData?.isSubscribed && userData?.subscriptionStatus === 'active') {
          creditsToSet = 50;
        }

        await updateDoc(userDocRef, {
          credits: creditsToSet,
          lastCreditReset: Timestamp.fromDate(now)
        });
      }
    } catch (error) {
      console.error('Error resetting daily credits:', error);
    }
  }

  private async initializeUser(): Promise<void> {
    const userDocRef = doc(db, 'users', this.email);
    await setDoc(userDocRef, {
      credits: 10,
      lastCreditReset: Timestamp.fromDate(new Date()),  // Store as Firestore Timestamp
      membershipLevel: 'Free'
    });
  }
}

export class GuestCreditManager implements CreditManager {
  private defaultCredits: number;
  
  constructor(defaultCredits: number = 0) {
    this.defaultCredits = defaultCredits;
  }

  async getCredits(): Promise<number> {
    return 0;
  }

  async reduceCredits(): Promise<boolean> {
    return false;
  }

  async resetDailyCredits(): Promise<void> {
    // No credits for guests
  }
}

export function getCreditManager(email?: string): CreditManager {
  return email 
    ? new UserCreditManager(email) 
    : new GuestCreditManager();
}
