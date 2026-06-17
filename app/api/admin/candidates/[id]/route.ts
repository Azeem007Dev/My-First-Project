import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * PUT /api/admin/candidates/[id]
 * Update a candidate (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const candidateId = params.id;

    // Parse request body
    const body = await request.json();
    const { name, party, symbol, description, imageUrl } = body;

    // Validate required fields
    if (!name || !party || !symbol) {
      return NextResponse.json(
        { success: false, error: 'Name, party, and symbol are required' },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const candidateDoc = await adminDb.collection('candidates').doc(candidateId).get();
    if (!candidateDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if name is taken by another candidate
    if (name.trim() !== candidateDoc.data()?.name) {
      const existingCandidate = await adminDb
        .collection('candidates')
        .where('name', '==', name.trim())
        .limit(1)
        .get();

      if (!existingCandidate.empty) {
        return NextResponse.json(
          { success: false, error: 'A candidate with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Check if symbol is taken by another candidate
    if (symbol.trim() !== candidateDoc.data()?.symbol) {
      const existingSymbol = await adminDb
        .collection('candidates')
        .where('symbol', '==', symbol.trim())
        .limit(1)
        .get();

      if (!existingSymbol.empty) {
        return NextResponse.json(
          { success: false, error: 'This symbol is already taken by another candidate' },
          { status: 400 }
        );
      }
    }

    // Update candidate document
    const updateData = {
      name: name.trim(),
      party: party.trim(),
      symbol: symbol.trim(),
      description: description?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
      updatedAt: new Date(),
      updatedBy: decodedToken.uid,
    };

    await adminDb.collection('candidates').doc(candidateId).update(updateData);

    // Get updated candidate
    const updatedDoc = await adminDb.collection('candidates').doc(candidateId).get();
    const candidateData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidateId,
        ...candidateData,
        createdAt: candidateData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: candidateData?.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      },
      message: 'Candidate updated successfully',
    });
  } catch (error: any) {
    console.error('Update candidate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/candidates/[id]
 * Delete a candidate (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const candidateId = params.id;

    // Check if candidate exists
    const candidateDoc = await adminDb.collection('candidates').doc(candidateId).get();
    if (!candidateDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if candidate has any votes (optional - you might want to prevent deletion if votes exist)
    const votesSnapshot = await adminDb
      .collection('votes')
      .where('candidateId', '==', candidateId)
      .limit(1)
      .get();

    if (!votesSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete candidate - votes have already been cast for this candidate' },
        { status: 400 }
      );
    }

    // Delete candidate
    await adminDb.collection('candidates').doc(candidateId).delete();

    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete candidate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}
