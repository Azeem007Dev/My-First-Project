import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * GET /api/admin/candidates
 * Get all candidates (Admin only)
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

    // Get all candidates
    const candidatesSnapshot = await adminDb
      .collection('candidates')
      .orderBy('createdAt', 'desc')
      .get();

    const candidates = candidatesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        party: data.party,
        symbol: data.symbol,
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      candidates,
      count: candidates.length,
    });
  } catch (error: any) {
    console.error('Get candidates error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get candidates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/candidates
 * Create a new candidate (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/candidates - Request received');
    
    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminDb) {
      console.log('POST: Firebase Admin not initialized');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('POST: Auth header exists:', !!authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST: No valid auth header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Extract and verify token
    const idToken = authHeader.substring(7);
    console.log('POST: Token length:', idToken.length);
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log('POST: Token verified for user:', decodedToken.uid);
    } catch (error: any) {
      console.error('POST: Token verification error:', error.message);
      return NextResponse.json(
        { success: false, error: `Token verification failed: ${error.message}` },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      console.log('POST: User document not found for UID:', decodedToken.uid);
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    console.log('POST: User data:', { uid: decodedToken.uid, isAdmin: userData?.isAdmin, name: userData?.name });
    if (!userData?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Admin privileges required' },
        { status: 403 }
      );
    }

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

    // Check if candidate with same name already exists
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

    // Check if symbol is already taken
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

    // Create candidate document
    const candidateData = {
      name: name.trim(),
      party: party.trim(),
      symbol: symbol.trim(),
      description: description?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decodedToken.uid,
    };

    const docRef = await adminDb.collection('candidates').add(candidateData);

    return NextResponse.json({
      success: true,
      candidate: {
        id: docRef.id,
        ...candidateData,
        createdAt: candidateData.createdAt.toISOString(),
        updatedAt: candidateData.updatedAt.toISOString(),
      },
      message: 'Candidate created successfully',
    });
  } catch (error: any) {
    console.error('Create candidate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
