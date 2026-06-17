import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, admin } from '@/lib/firebaseAdmin';
import { COLLECTIONS, VoteLedgerUser } from '@/config/firebase-init';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, cnic, email, password } = body;

    if (!name || !cnic || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists by email
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'An account with this email already exists. Please use a different email or try signing in.' 
        }, { status: 409 });
      }
    } catch (error: any) {
      // If getUserByEmail throws an error, it means user doesn't exist (which is what we want)
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Check if CNIC is already in use
    const cnicQuery = await adminDb.collection(COLLECTIONS.USERS)
      .where('cnic', '==', cnic)
      .limit(1)
      .get();
    
    if (!cnicQuery.empty) {
      return NextResponse.json({ 
        success: false, 
        error: 'An account with this CNIC already exists. Please use a different CNIC.' 
      }, { status: 409 });
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Initialize user with empty election blocks structure
    // Election-specific blockchains will be created when elections are created
    const userProfile: VoteLedgerUser = {
      uid: userRecord.uid,
      name,
      cnic,
      email,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      electionBlocks: {}, // Initialize with empty election blocks
    };

    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      ...userProfile,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } as any);

    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('API signup error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ 
        success: false, 
        error: 'An account with this email already exists. Please use a different email or try signing in.' 
      }, { status: 409 });
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email address format.' 
      }, { status: 400 });
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json({ 
        success: false, 
        error: 'Password is too weak. Please choose a stronger password.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Signup failed. Please try again.' 
    }, { status: 500 });
  }
}
