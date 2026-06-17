/**
 * API Route: Cast Vote
 * POST /api/vote/cast
 * Handles vote casting with blockchain integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
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
    const voterId = decodedToken.uid;

    // Get request body
    const body = await request.json();
    const { candidateId, electionId } = body;

    if (!candidateId || !electionId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID and Election ID are required' },
        { status: 400 }
      );
    }

    const db = getFirestore(adminApp);

    // Check if election exists and is active
    const electionDoc = await db.collection('elections').doc(electionId).get();
    if (!electionDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Election not found' },
        { status: 404 }
      );
    }

    const electionData = electionDoc.data();
    if (electionData?.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Election is not active' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVoteQuery = await db
      .collection('votes')
      .where('voterId', '==', voterId)
      .where('electionId', '==', electionId)
      .limit(1)
      .get();

    if (!existingVoteQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already voted in this election' },
        { status: 400 }
      );
    }

    // Import blockchain service
    const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');

    // Add vote to blockchain (all users)
    const blockchainResult = await BlockchainDatabaseService.addVoteBlockToAllUsers(
      electionId,
      candidateId,
      voterId
    );

    if (!blockchainResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: blockchainResult.error || 'Failed to add vote to blockchain' 
        },
        { status: 500 }
      );
    }

    // Create vote document
    const voteRef = await db.collection('votes').add({
      voterId,
      candidateId,
      electionId,
      timestamp: new Date(),
      transactionHash: blockchainResult.block?.hash,
    });

    // Update vote count
    const voteCountRef = db.collection('voteCounts').doc(`${electionId}_${candidateId}`);
    const voteCountDoc = await voteCountRef.get();

    if (voteCountDoc.exists) {
      const currentCount = voteCountDoc.data()?.count || 0;
      await voteCountRef.update({
        count: currentCount + 1,
        lastUpdated: new Date(),
      });
    } else {
      await voteCountRef.set({
        electionId,
        candidateId,
        count: 1,
        lastUpdated: new Date(),
      });
    }

    // Update election statistics
    const totalVotesSnapshot = await db
      .collection('votes')
      .where('electionId', '==', electionId)
      .count()
      .get();

    const totalVotes = totalVotesSnapshot.data().count;

    // Get total registered voters (non-admin users)
    const totalVotersSnapshot = await db
      .collection('users')
      .where('isAdmin', '==', false)
      .count()
      .get();

    const totalVoters = totalVotersSnapshot.data().count;
    const turnoutPercentage = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

    await db.collection('elections').doc(electionId).update({
      totalVotes,
      totalVoters,
      turnoutPercentage,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      voteId: voteRef.id,
      blockHash: blockchainResult.block?.hash,
      message: 'Vote cast successfully and added to blockchain',
    });
  } catch (error: any) {
    console.error('Cast vote API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to cast vote. Please try again.' 
      },
      { status: 500 }
    );
  }
}

