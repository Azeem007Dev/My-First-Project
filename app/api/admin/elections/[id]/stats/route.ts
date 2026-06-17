import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * GET /api/admin/elections/[id]/stats
 * Get election statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check if user is admin
    const userDoc = await adminAuth.getUser(decodedToken.uid);
    const isAdmin = userDoc.customClaims?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get election
    const elections = await DatabaseService.getElections();
    const election = elections.find(e => e.id === id);

    if (!election) {
      return NextResponse.json(
        { success: false, error: 'Election not found' },
        { status: 404 }
      );
    }

    // Get statistics
    const voteStats = await DatabaseService.getVoteStatistics(election.id!);
    const allUsers = await DatabaseService.getAllUsers();

    const stats = {
      totalVoters: allUsers.length,
      totalVotes: voteStats.totalVotes,
      turnoutPercentage: allUsers.length > 0 
        ? Math.round((voteStats.totalVotes / allUsers.length) * 100 * 10) / 10
        : 0,
      status: election.status,
      candidateResults: voteStats.candidateResults,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Get election stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch election statistics',
      },
      { status: 500 }
    );
  }
}

