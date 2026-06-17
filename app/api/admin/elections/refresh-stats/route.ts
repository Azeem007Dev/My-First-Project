/**
 * POST /api/admin/elections/refresh-stats
 * Refreshes all election statistics
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

    // Refresh all election statistics
    const success = await DatabaseService.refreshAllElectionStats();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'All election statistics refreshed successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to refresh election statistics' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Refresh election stats error:', error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to refresh election statistics' 
    }, { status: 500 });
  }
}
