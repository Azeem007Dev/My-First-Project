import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

/**
 * GET /api/admin/elections
 * Get all elections
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

    // Get all elections from database
    const elections = await DatabaseService.getElections();
    console.log('Retrieved elections from database:', elections.length);

    // Update statistics for each election and return with fresh data
    const electionsWithStats = await Promise.all(
      elections.map(async (election) => {
        // Update stats in database
        await DatabaseService.updateElectionStats(election.id!);
        
        // Get fresh stats from database
        const stats = await DatabaseService.getVoteStatistics(election.id!);
        // Use non-admin users only for voter statistics
        const voters = await DatabaseService.getNonAdminUsers();
        
        return {
          ...election,
          totalVotes: stats.totalVotes,
          totalVoters: voters.length,
          turnoutPercentage: voters.length > 0 
            ? Math.round((stats.totalVotes / voters.length) * 100 * 10) / 10
            : 0,
        };
      })
    );

    console.log('Returning elections with stats:', electionsWithStats.length);
    return NextResponse.json({
      success: true,
      elections: electionsWithStats,
    });
  } catch (error: any) {
    console.error('Get elections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch elections',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/elections
 * Create a new election
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/elections - Starting request');
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('Token verified for user:', decodedToken.uid);

    // Check if user is admin
    const userDoc = await adminAuth.getUser(decodedToken.uid);
    const isAdmin = userDoc.customClaims?.isAdmin === true;
    console.log('User is admin:', isAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    const { title, description, startDate, endDate, candidates } = body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log('Dates:', { start, end });

    // Validate dates
    if (end <= start) {
      console.log('Invalid date range');
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create election in database
    console.log('Creating election in database...');
    const electionId = await DatabaseService.createElection({
      title,
      description,
      startDate: start,
      endDate: end,
      status: 'upcoming',
      candidates: candidates || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Election created with ID:', electionId);

    if (!electionId) {
      console.log('Failed to create election - no ID returned');
      return NextResponse.json(
        { success: false, error: 'Failed to create election' },
        { status: 500 }
      );
    }

    // Initialize blockchain for this election
    console.log('Initializing blockchain for new election...');
    const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
    await BlockchainDatabaseService.initializeElectionBlockchain(electionId);

    // Update election statistics
    console.log('Updating election statistics...');
    await DatabaseService.updateElectionStats(electionId);

    // Get the created election with fresh data
    console.log('Fetching created election from database...');
    const elections = await DatabaseService.getElections();
    const election = elections.find(e => e.id === electionId);
    console.log('Found election:', election);

    if (!election) {
      console.log('Warning: Created election not found in list');
      // Return basic election data instead of failing
      const basicElection = {
        id: electionId,
        title,
        description,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: 'upcoming',
        candidates: candidates || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalVotes: 0,
        totalVoters: 0,
        turnoutPercentage: 0,
      };
      return NextResponse.json({
        success: true,
        election: basicElection,
      });
    }

    return NextResponse.json({
      success: true,
      election,
    });
  } catch (error: any) {
    console.error('Create election error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create election',
      },
      { status: 500 }
    );
  }
}

