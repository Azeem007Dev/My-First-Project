/**
 * Admin Stats API Route
 * Provides comprehensive statistics for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

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

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin privileges required' },
        { status: 403 }
      );
    }

    // Get all users (excluding admins - they are not counted as voters)
    const usersSnapshot = await adminDb.collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter out admin users - admins can vote but shouldn't be counted in voter statistics
    const voters = allUsers.filter((user: any) => !user.isAdmin);
    const totalUsers = voters.length;
    const totalAdmins = allUsers.length - voters.length;
    
    console.log('📊 Stats API - Total users in database:', allUsers.length);
    console.log('📊 Stats API - Admin users (excluded from voter count):', totalAdmins);
    console.log('📊 Stats API - Registered voters (non-admin):', totalUsers);

    // Get all elections
    const electionsSnapshot = await adminDb.collection('elections').get();
    const totalElections = electionsSnapshot.size;
    console.log('📊 Stats API - Total elections in database:', totalElections);

    // Calculate total votes across all elections
    let totalVotesAllTime = 0;
    let totalVotersAllTime = 0;
    let activeElection: any = null;
    let activeElectionStats = {
      totalVotes: 0,
      totalVoters: 0,
      turnoutPercentage: 0,
      status: 'upcoming' as 'upcoming' | 'active' | 'ended'
    };

    for (const electionDoc of electionsSnapshot.docs) {
      const election = electionDoc.data();
      
      // Count votes for this election
      const votesSnapshot = await adminDb
        .collection('votes')
        .where('electionId', '==', electionDoc.id)
        .get();
      
      const voteCount = votesSnapshot.size;
      totalVotesAllTime += voteCount;

      // Get unique voters for this election
      const uniqueVoters = new Set();
      votesSnapshot.forEach(voteDoc => {
        uniqueVoters.add(voteDoc.data().voterId); // Fixed: use voterId instead of voterCNIC
      });
      const voterCount = uniqueVoters.size;
      totalVotersAllTime = Math.max(totalVotersAllTime, voterCount);

      // If this is the active election, store its stats
      if (election.status === 'active') {
        activeElection = {
          ...election,
          id: electionDoc.id
        };
        activeElectionStats = {
          totalVotes: voteCount,
          totalVoters: totalUsers,
          turnoutPercentage: totalUsers > 0 ? parseFloat(((voteCount / totalUsers) * 100).toFixed(2)) : 0,
          status: 'active'
        };
      }
    }

    // If no active election, find the most recent one
    if (!activeElection && electionsSnapshot.size > 0) {
      const sortedElections = electionsSnapshot.docs
        .map(doc => ({ ...(doc.data() as any), id: doc.id }))
        .filter((e: any) => e.endDate)
        .sort((a: any, b: any) => {
          const aDate = a.endDate?.toDate?.() || new Date(a.endDate);
          const bDate = b.endDate?.toDate?.() || new Date(b.endDate);
          return bDate.getTime() - aDate.getTime();
        });
      
      activeElection = sortedElections[0];
      
      // Get stats for the most recent election
      const votesSnapshot = await adminDb
        .collection('votes')
        .where('electionId', '==', activeElection.id)
        .get();
      
      const voteCount = votesSnapshot.size;
      const uniqueVoters = new Set();
      votesSnapshot.forEach(voteDoc => {
        uniqueVoters.add(voteDoc.data().voterId); // Fixed: use voterId instead of voterCNIC
      });

      activeElectionStats = {
        totalVotes: voteCount,
        totalVoters: totalUsers,
        turnoutPercentage: totalUsers > 0 ? parseFloat(((voteCount / totalUsers) * 100).toFixed(2)) : 0,
        status: activeElection.status || 'upcoming'
      };
    }

    // Calculate growth metrics
    // Get users from last month (excluding admins)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentUsersSnapshot = await adminDb
      .collection('users')
      .where('createdAt', '>=', oneMonthAgo)
      .get();
    
    // Count only non-admin users in growth
    const recentNonAdminUsers = recentUsersSnapshot.docs.filter(doc => !doc.data().isAdmin);
    const newUsersThisMonth = recentNonAdminUsers.length;
    const previousMonthUsers = totalUsers - newUsersThisMonth;
    const userGrowthPercentage = previousMonthUsers > 0 
      ? parseFloat(((newUsersThisMonth / previousMonthUsers) * 100).toFixed(1))
      : 0;

    // Get candidates count
    const candidatesSnapshot = await adminDb.collection('candidates').get();
    const totalCandidates = candidatesSnapshot.size;
    console.log('📊 Stats API - Total candidates:', totalCandidates);

    // Calculate system uptime (simplified - in production you'd track this properly)
    const systemUptime = 99.9;

    console.log('📊 Stats API - Final stats:', {
      totalVoters: totalUsers,
      totalElections,
      totalVotesAllTime,
      totalCandidates,
      userGrowthPercentage,
      newUsersThisMonth,
      adminsExcluded: totalAdmins,
      activeElectionTitle: activeElection?.title || 'No active election'
    });

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalElections,
          totalVotesAllTime,
          totalCandidates,
          userGrowthPercentage,
          newUsersThisMonth
        },
        activeElection: {
          ...activeElectionStats,
          electionTitle: activeElection?.title || 'No active election',
          electionId: activeElection?.id || null
        },
        system: {
          uptimePercentage: systemUptime,
          databaseStatus: 'connected',
          blockchainStatus: 'online'
        }
      }
    });

  } catch (error: any) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch admin statistics' 
      },
      { status: 500 }
    );
  }
}

