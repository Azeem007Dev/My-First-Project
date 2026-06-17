/**
 * POST /api/admin/elections/force-close-all
 * Force close all active elections (for testing purposes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin';
import { DatabaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing or invalid authorization header' 
      }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user
    const decodedToken = await getAuth().verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Get all elections
    const elections = await DatabaseService.getElections();
    const activeElections = elections.filter(e => e.status === 'active');
    
    let closedCount = 0;
    const results = [];

    for (const election of activeElections) {
      if (election.id) {
        const success = await DatabaseService.updateElection(election.id, { status: 'ended' });
        if (success) {
          closedCount++;
          results.push({ id: election.id, title: election.title, success: true });
        } else {
          results.push({ id: election.id, title: election.title, success: false });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Force closed ${closedCount} active elections`,
      closedCount,
      totalActive: activeElections.length,
      results
    });
  } catch (error: any) {
    console.error('Force close elections error:', error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to force close elections' 
    }, { status: 500 });
  }
}
