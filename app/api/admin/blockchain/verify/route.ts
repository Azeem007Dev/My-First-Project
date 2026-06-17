/**
 * API Route: Verify Blockchain
 * GET /api/admin/blockchain/verify
 * Verify blockchain integrity across all users (Admin only)
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

    // Verify token and check admin status
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getFirestore(adminApp);
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Verify blockchain integrity
    const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
    const integrityReport = await BlockchainDatabaseService.verifyBlockchainIntegrity();

    return NextResponse.json({
      success: true,
      data: {
        isIntegritySafe: integrityReport.isIntegritySafe,
        matchPercentage: integrityReport.matchPercentage,
        totalUsers: integrityReport.totalUsers,
        consensusChainLength: integrityReport.consensusChain.length,
        discrepancies: integrityReport.discrepancies,
        status: integrityReport.isIntegritySafe 
          ? 'All blockchains are in sync' 
          : 'Some blockchains have discrepancies',
      },
    });
  } catch (error: any) {
    console.error('Verify blockchain API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to verify blockchain' 
      },
      { status: 500 }
    );
  }
}

