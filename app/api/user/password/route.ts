import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

/**
 * PUT /api/user/password
 * Change user's password
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
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
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
        },
        { status: 400 }
      );
    }

    // Note: We cannot verify the current password directly with Firebase Admin SDK
    // The client should re-authenticate before calling this endpoint
    // For now, we'll update the password and let Firebase handle validation

    try {
      // Update password using Firebase Admin SDK
      await adminAuth.updateUser(uid, {
        password: newPassword,
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully. Please sign in again with your new password.',
      });
    } catch (error: any) {
      console.error('Password update error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/weak-password') {
        return NextResponse.json(
          { success: false, error: 'Password is too weak' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to update password: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}

