import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * PATCH /api/admin/elections/[id]/status
 * Update election status (activate/close election)
 */
export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['upcoming', 'active', 'ended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: upcoming, active, or ended' },
        { status: 400 }
      );
    }

    // Update election status
    const success = await DatabaseService.updateElection(id, { status });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update election status' },
        { status: 500 }
      );
    }

    // Get updated election
    const elections = await DatabaseService.getElections();
    const election = elections.find(e => e.id === id);

    if (!election) {
      return NextResponse.json(
        { success: false, error: 'Election not found after update' },
        { status: 404 }
      );
    }

    // Get statistics (use non-admin users only)
    const stats = await DatabaseService.getVoteStatistics(election.id!);
    const voters = await DatabaseService.getNonAdminUsers();

    const electionWithStats = {
      ...election,
      totalVotes: stats.totalVotes,
      totalVoters: voters.length,
      turnoutPercentage: voters.length > 0 
        ? Math.round((stats.totalVotes / voters.length) * 100 * 10) / 10
        : 0,
    };

    return NextResponse.json({
      success: true,
      election: electionWithStats,
      message: `Election status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Update election status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update election status',
      },
      { status: 500 }
    );
  }
}

