import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * POST /api/admin/elections/[id]/deploy
 * Deploy election results to blockchain
 */
export async function POST(
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

    // Check if election is closed
    if (election.status !== 'ended') {
      return NextResponse.json(
        { success: false, error: 'Election must be closed before deploying results' },
        { status: 400 }
      );
    }

    // Get election results
    const stats = await DatabaseService.getVoteStatistics(election.id!);
    const candidates = await DatabaseService.getCandidates();

    // Prepare results for blockchain deployment
    const results = stats.candidateResults.map(result => {
      const candidate = candidates.find(c => c.id === result.candidateId);
      return {
        candidateId: result.candidateId,
        candidateName: result.candidateName,
        party: candidate?.party || 'Unknown',
        symbol: candidate?.symbol || '?',
        votes: result.votes,
      };
    });

    // TODO: Implement actual blockchain deployment
    // For now, we'll simulate the deployment process
    console.log('Deploying results to blockchain:', {
      electionId: election.id,
      electionTitle: election.title,
      totalVotes: stats.totalVotes,
      results,
    });

    // Simulate blockchain transaction
    const transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    // Update election with deployment info
    await DatabaseService.updateElection(id, {
      status: 'ended',
      // You might want to add a 'deployed' flag or timestamp
    });

    return NextResponse.json({
      success: true,
      message: 'Results deployed successfully',
      transactionHash,
      election: {
        ...election,
        totalVotes: stats.totalVotes,
      },
      results,
    });
  } catch (error: any) {
    console.error('Deploy results error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to deploy results',
      },
      { status: 500 }
    );
  }
}

