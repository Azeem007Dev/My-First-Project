/**
 * API Route: Vote Status
 * GET /api/vote/status
 * Get voting status and blockchain information
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

    // Get user's blockchain
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const voteBlocks = userData?.voteBlocks || [];

    // Get active election
    const activeElectionQuery = await db
      .collection('elections')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    let activeElection = null;
    let hasVoted = false;

    if (!activeElectionQuery.empty) {
      const electionDoc = activeElectionQuery.docs[0];
      activeElection = {
        id: electionDoc.id,
        ...electionDoc.data(),
      };

      // Check if user has voted in active election
      const voteQuery = await db
        .collection('votes')
        .where('voterId', '==', userId)
        .where('electionId', '==', electionDoc.id)
        .limit(1)
        .get();

      hasVoted = !voteQuery.empty;
    }

    // Get blockchain stats
    const { VoteBlockchainService } = await import('@/services/vote-blockchain-service');
    const blockchainStats = VoteBlockchainService.getBlockchainStats(voteBlocks);

    return NextResponse.json({
      success: true,
      data: {
        hasVoted,
        activeElection,
        blockchain: {
          totalBlocks: blockchainStats.totalBlocks,
          totalVotes: blockchainStats.totalVotes,
          lastBlockHash: blockchainStats.lastBlockHash,
          genesisHash: blockchainStats.genesisHash,
        },
      },
    });
  } catch (error: any) {
    console.error('Vote status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get vote status' 
      },
      { status: 500 }
    );
  }
}

