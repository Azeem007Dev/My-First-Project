import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS, VoteLedgerUser } from '@/config/firebase-init';

// Prefer global fetch (Node 18+). If not available, we'll dynamically import node-fetch at runtime.
async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  throw new Error('Global fetch is not available in this Node runtime. Please run on Node 18+ or install node-fetch.');
}

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { cnic, email, password } = await req.json();

    if (!password || (!cnic && !email)) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    let userProfile: VoteLedgerUser | null = null;
    let targetEmail = email;

    if (cnic) {
      // lookup by CNIC
      const q = await adminDb.collection(COLLECTIONS.USERS).where('cnic', '==', cnic).limit(1).get();
      if (q.empty) {
        return NextResponse.json({ success: false, error: 'CNIC not found' }, { status: 404 });
      }
      const doc = q.docs[0];
      userProfile = doc.data() as VoteLedgerUser;
      targetEmail = userProfile.email;
    }

    // Verify password using Firebase Auth REST API (server-side)
    if (!FIREBASE_API_KEY) {
      return NextResponse.json({ success: false, error: 'Firebase API key not configured on server' }, { status: 500 });
    }

    const _fetch = await getFetch();
    const resp = await _fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, password, returnSecureToken: true }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ success: false, error: data.error?.message || 'Authentication failed' }, { status: 401 });
    }

    // Retrieve or rebuild user profile
    const uid = data.localId;
    if (!userProfile) {
      const doc = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
      if (doc.exists) userProfile = doc.data() as VoteLedgerUser;
    }

    // Create a custom token for the client to use if desired
    const customToken = await adminAuth.createCustomToken(uid, { isAdmin: userProfile?.isAdmin || false });

    return NextResponse.json({ success: true, idToken: data.idToken, refreshToken: data.refreshToken, customToken, user: userProfile });
  } catch (error: any) {
    console.error('API signin error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Sign in failed' }, { status: 500 });
  }
}
