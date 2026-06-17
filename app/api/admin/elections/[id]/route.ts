import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * GET /api/admin/elections/[id]
 * Get a single election by ID
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

    // Get all elections and find the one with matching ID
    const elections = await DatabaseService.getElections();
    const election = elections.find(e => e.id === id);

    if (!election) {
      return NextResponse.json(
        { success: false, error: 'Election not found' },
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
    });
  } catch (error: any) {
    console.error('Get election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch election',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/elections/[id]
 * Update an election
 */
export async function PUT(
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
    const { title, description, startDate, endDate, candidates } = body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if election exists and get its current status
    const elections = await DatabaseService.getElections();
    const existingElection = elections.find(e => e.id === id);
    
    if (!existingElection) {
      return NextResponse.json(
        { success: false, error: 'Election not found' },
        { status: 404 }
      );
    }

    // Prevent editing if election is active or ended
    if (existingElection.status === 'active' || existingElection.status === 'ended') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot edit election. Election is currently ${existingElection.status}. Only upcoming elections can be edited.` 
        },
        { status: 403 }
      );
    }

    // Convert dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (end <= start) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Update election
    const success = await DatabaseService.updateElection(id, {
      title,
      description,
      startDate: start,
      endDate: end,
      candidates: candidates || [],
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update election' },
        { status: 500 }
      );
    }

    // Get updated election

  const updatedElections = await DatabaseService.getElections();
  const election = updatedElections.find(e => e.id === id);

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
      message: 'Election updated successfully',
    });
  } catch (error: any) {
    console.error('Update election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update election',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/elections/[id]
 * Delete an election
 */
export async function DELETE(
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

    console.log('Deleting election:', id);

    // Check if election exists and get its current status
    const elections = await DatabaseService.getElections();
    const existingElection = elections.find(e => e.id === id);
    
    if (!existingElection) {
      return NextResponse.json(
        { success: false, error: 'Election not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if election is active or ended
    if (existingElection.status === 'active' || existingElection.status === 'ended') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete election. Election is currently ${existingElection.status}. Only upcoming elections can be deleted.` 
        },
        { status: 403 }
      );
    }

    // Delete the election
    const success = await DatabaseService.deleteElection(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete election. Make sure it has no votes.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Election deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete election error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete election',
      },
      { status: 500 }
    );
  }
}

