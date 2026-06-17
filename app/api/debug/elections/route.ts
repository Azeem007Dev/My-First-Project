/**
 * Debug API Route: Check Elections
 * GET /api/debug/elections
 * Debug endpoint to check all elections in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    const adminApp = initializeFirebaseAdmin();
    if (!adminApp) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getFirestore(adminApp);

    // Get ALL elections (not just active ones)
    const allElectionsSnapshot = await db
      .collection('elections')
      .get();

    const allElections = allElectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as any[];

    // Get active elections specifically
    const activeElectionsSnapshot = await db
      .collection('elections')
      .where('status', '==', 'active')
      .get();

    const activeElections = activeElectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as any[];

    const debugInfo = {
      userId,
      timestamp: new Date().toISOString(),
      elections: {
        total: allElections.length,
        active: activeElections.length,
        allElections: allElections.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        activeElections: activeElections.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
          candidates: e.candidates,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      debugInfo,
    });
  } catch (error: any) {
    console.error('Debug elections API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to debug elections' 
      },
      { status: 500 }
    );
  }
}
