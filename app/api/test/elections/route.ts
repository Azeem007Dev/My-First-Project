/**
 * Test API Route: Check Elections (No Auth Required)
 * GET /api/test/elections
 * Simple test endpoint to check elections without authentication
 */

import { NextRequest, NextResponse } from 'next/server';
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

    const db = getFirestore(adminApp);

    // Get ALL elections
    const allElectionsSnapshot = await db
      .collection('elections')
      .get();

    const allElections = allElectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      status: doc.data().status,
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      candidates: doc.data().candidates,
    }));

    // Get active elections specifically
    const activeElectionsSnapshot = await db
      .collection('elections')
      .where('status', '==', 'active')
      .get();

    const activeElections = activeElectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      status: doc.data().status,
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      candidates: doc.data().candidates,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalElections: allElections.length,
        activeElectionsCount: activeElections.length,
        allElections,
        activeElections,
      },
    });
  } catch (error: any) {
    console.error('Test elections API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get elections' 
      },
      { status: 500 }
    );
  }
}
