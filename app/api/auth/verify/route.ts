import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/config/firebase-init';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
    const user = userDoc.exists ? userDoc.data() : null;

    return NextResponse.json({ success: true, claims: decoded, user });
  } catch (error: any) {
    console.error('Token verify error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Token verification failed' }, { status: 401 });
  }
}
