import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { VoteLedgerUser, COLLECTIONS } from '@/config/firebase-init';

// Authentication service for Vote Ledger
export class AuthService {
  // Sign up with email and password, then create user profile
  static async signUp(userData: {
    name: string;
    cnic: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; user?: VoteLedgerUser }> {
    try {
      // Validate CNIC format
      if (!this.validateCNIC(userData.cnic)) {
        return { success: false, error: 'CNIC format should be XXXXX-XXXXXXX-X' };
      }

      // Check if CNIC already exists
      const existingUser = await this.getUserByCNIC(userData.cnic);
      if (existingUser) {
        return { success: false, error: 'CNIC already registered' };
      }

      // Check if email already exists
      const existingEmail = await this.getUserByEmail(userData.email);
      if (existingEmail) {
        return { success: false, error: 'Email already registered' };
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: userData.name,
      });

      // Create user profile in Firestore
      const voteLedgerUser: VoteLedgerUser = {
        uid: user.uid,
        name: userData.name,
        cnic: userData.cnic,
        email: userData.email,
        isAdmin: false, // Default to regular user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), voteLedgerUser);

      return { success: true, user: voteLedgerUser };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Sign in with CNIC and password
  static async signIn(cnic: string, password: string): Promise<{
    success: boolean;
    error?: string;
    user?: VoteLedgerUser;
  }> {
    try {
      // Validate CNIC format
      if (!this.validateCNIC(cnic)) {
        return { success: false, error: 'CNIC format should be XXXXX-XXXXXXX-X' };
      }

      // Get user by CNIC
      const userDoc = await this.getUserByCNIC(cnic);
      if (!userDoc) {
        return { success: false, error: 'CNIC not found' };
      }

      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userDoc.email,
        password
      );

      // Get updated user profile
      const voteLedgerUser = await this.getUserProfile(userCredential.user.uid);

      return { success: true, user: voteLedgerUser || undefined };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Sign out current user
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user profile
  static async getCurrentUser(): Promise<VoteLedgerUser | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      return await this.getUserProfile(user.uid);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get user profile by UID
  static async getUserProfile(uid: string): Promise<VoteLedgerUser | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (userDoc.exists()) {
        return userDoc.data() as VoteLedgerUser;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Get user by CNIC
  static async getUserByCNIC(cnic: string): Promise<VoteLedgerUser | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('cnic', '==', cnic)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data() as VoteLedgerUser;
      }
      return null;
    } catch (error) {
      console.error('Get user by CNIC error:', error);
      return null;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<VoteLedgerUser | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data() as VoteLedgerUser;
      }
      return null;
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }

  // Validate CNIC format (Pakistani format)
  static validateCNIC(cnic: string): boolean {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    return { isValid: true };
  }

  // Get user-friendly error messages
  private static getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Email is already registered';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return error.message || 'An error occurred during authentication';
    }
  }
}

// Hook for listening to authentication state changes
export const useAuthState = () => {
  return new Promise<VoteLedgerUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userProfile = await AuthService.getUserProfile(user.uid);
        resolve(userProfile);
      } else {
        resolve(null);
      }
      unsubscribe();
    });
  });
};
