import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/user/voting-history
 * Get current user's voting history
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Extract and verify token
    const idToken = authHeader.substring(7);
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // Get user's votes
    const votesSnapshot = await adminDb
      .collection('votes')
      .where('voterId', '==', uid)
      .orderBy('timestamp', 'desc')
      .get();

    if (votesSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Store adminDb reference for use in map function
    const db = adminDb;

    // Get election and candidate details for each vote
    const votingHistory = await Promise.all(
      votesSnapshot.docs.map(async (voteDoc) => {
        const voteData = voteDoc.data();
        
        // Get election details
        let electionName = 'Unknown Election';
        try {
          const electionDoc = await db
            .collection('elections')
            .doc(voteData.electionId)
            .get();
          
          if (electionDoc.exists) {
            electionName = electionDoc.data()?.name || 'Unknown Election';
          }
        } catch (error) {
          console.error('Error fetching election:', error);
        }

        // Get candidate details
        let candidateName = 'Unknown Candidate';
        try {
          const candidateDoc = await db
            .collection('candidates')
            .doc(voteData.candidateId)
            .get();
          
          if (candidateDoc.exists) {
            candidateName = candidateDoc.data()?.name || 'Unknown Candidate';
          }
        } catch (error) {
          console.error('Error fetching candidate:', error);
        }

        return {
          id: voteDoc.id,
          electionId: voteData.electionId,
          electionName,
          candidateId: voteData.candidateId,
          candidateName,
          timestamp: voteData.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          blockchainHash: voteData.blockchainHash || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: votingHistory,
      count: votingHistory.length,
    });
  } catch (error: any) {
    console.error('Get voting history error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get voting history' },
      { status: 500 }
    );
  }
}

