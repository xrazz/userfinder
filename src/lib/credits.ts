import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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
  
  constructor(email: string, defaultCredits: number = 5) {
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
    const userDocRef = doc(db, 'users', this.email);
    const docSnap = await this.getUserDoc();
    const userData = docSnap.data();
    
    const lastReset = userData?.lastCreditReset?.toDate();
    const now = new Date();

    if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
      await updateDoc(userDocRef, {
        credits: this.defaultCredits,
        lastCreditReset: now
      });
    }
  }

  private async initializeUser(): Promise<void> {
    const userDocRef = doc(db, 'users', this.email);
    await setDoc(userDocRef, {
      credits: this.defaultCredits,
      lastCreditReset: new Date(),
      membershipLevel: 'Free'
    });
  }
}

export class GuestCreditManager implements CreditManager {
  private defaultCredits: number;
  
  constructor(defaultCredits: number = 3) {
    this.defaultCredits = defaultCredits;
  }

  async getCredits(): Promise<number> {
    const credits = parseInt(Cookies.get('guestCredits') || '0');
    if (!credits) {
      await this.resetDailyCredits();
      return this.defaultCredits;
    }
    return credits;
  }

  async reduceCredits(): Promise<boolean> {
    const currentCredits = await this.getCredits();
    if (currentCredits <= 0) return false;
    
    Cookies.set('guestCredits', String(currentCredits - 1), {
      expires: new Date(new Date().setHours(24, 0, 0, 0))
    });
    return true;
  }

  async resetDailyCredits(): Promise<void> {
    const lastResetDate = Cookies.get('guestCreditsLastReset');
    const today = new Date().toDateString();

    if (!lastResetDate || lastResetDate !== today) {
      Cookies.set('guestCredits', String(this.defaultCredits), {
        expires: new Date(new Date().setHours(24, 0, 0, 0))
      });
      Cookies.set('guestCreditsLastReset', today, {
        expires: new Date(new Date().setHours(24, 0, 0, 0))
      });
    }
  }
}

export function getCreditManager(email?: string): CreditManager {
  return email 
    ? new UserCreditManager(email) 
    : new GuestCreditManager();
}
