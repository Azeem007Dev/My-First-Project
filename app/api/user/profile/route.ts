import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/user/profile
 * Get current user's profile
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
    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
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

    // Get user profile from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Get voting history count
    const votesSnapshot = await adminDb
      .collection('votes')
      .where('voterId', '==', uid)
      .get();
    
    const votingHistory = votesSnapshot.size;

    // Format profile data
    const profile = {
      uid: uid,
      name: userData?.name || '',
      cnic: userData?.cnic || '',
      email: userData?.email || '',
      isAdmin: userData?.isAdmin || false,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      updatedAt: userData?.updatedAt?.toDate() || new Date(),
      registrationDate: userData?.createdAt?.toDate()?.toISOString().split('T')[0] || '',
      lastLogin: new Date().toISOString().split('T')[0],
      votingHistory,
    };

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { name, email } = body;

    // Validate updates
    if (!name && !email) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updates: any = {
      updatedAt: new Date(),
    };

    // Validate and add name if provided
    if (name !== undefined) {
      if (!name.trim() || name.trim().length < 3) {
        return NextResponse.json(
          { success: false, error: 'Name must be at least 3 characters' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
      
      // Update Firebase Auth display name
      try {
        await adminAuth.updateUser(uid, {
          displayName: name.trim(),
        });
      } catch (error) {
        console.error('Error updating auth display name:', error);
        // Continue even if this fails
      }
    }

    // Validate and add email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email is already in use by another user
      try {
        const existingUsers = await adminDb
          .collection('users')
          .where('email', '==', email)
          .get();
        
        // Check if email belongs to a different user
        if (!existingUsers.empty) {
          const existingUserDoc = existingUsers.docs[0];
          if (existingUserDoc.id !== uid) {
            return NextResponse.json(
              { success: false, error: 'Email is already in use' },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        console.error('Error checking email:', error);
      }

      updates.email = email;
      
      // Update Firebase Auth email
      try {
        await adminAuth.updateUser(uid, {
          email: email,
        });
      } catch (error: any) {
        console.error('Error updating auth email:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update email: ' + error.message },
          { status: 400 }
        );
      }
    }

    // Update user profile in Firestore
    await adminDb.collection('users').doc(uid).update(updates);

    // Get updated profile
    const updatedDoc = await adminDb.collection('users').doc(uid).get();
    const updatedData = updatedDoc.data();

    // Get voting history count
    const votesSnapshot = await adminDb
      .collection('votes')
      .where('voterId', '==', uid)
      .get();
    
    const votingHistory = votesSnapshot.size;

    const profile = {
      uid: uid,
      name: updatedData?.name || '',
      cnic: updatedData?.cnic || '',
      email: updatedData?.email || '',
      isAdmin: updatedData?.isAdmin || false,
      createdAt: updatedData?.createdAt?.toDate() || new Date(),
      updatedAt: updatedData?.updatedAt?.toDate() || new Date(),
      registrationDate: updatedData?.createdAt?.toDate()?.toISOString().split('T')[0] || '',
      lastLogin: new Date().toISOString().split('T')[0],
      votingHistory,
    };

    return NextResponse.json({
      success: true,
      profile,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

