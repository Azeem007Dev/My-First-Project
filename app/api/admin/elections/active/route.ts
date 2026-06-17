import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * GET /api/admin/elections/active
 * Get the currently active election
 */
export async function GET(request: NextRequest) {
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

    // Get active election
    const election = await DatabaseService.getActiveElection();

    if (!election) {
      return NextResponse.json(
        { success: true, election: null, message: 'No active election found' },
        { status: 200 }
      );
    }

    // Get statistics
    const stats = await DatabaseService.getVoteStatistics(election.id!);
    const allUsers = await DatabaseService.getAllUsers();

    const electionWithStats = {
      ...election,
      totalVotes: stats.totalVotes,
      totalVoters: allUsers.length,
      turnoutPercentage: allUsers.length > 0 
        ? Math.round((stats.totalVotes / allUsers.length) * 100 * 10) / 10
        : 0,
    };

    return NextResponse.json({
      success: true,
      election: electionWithStats,
    });
  } catch (error: any) {
    console.error('Get active election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch active election',
      },
      { status: 500 }
    );
  }
}

