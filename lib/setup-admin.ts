/**
 * Setup Admin User
 * Creates admin user from environment variables if it doesn't exist
 */

import { adminAuth, adminDb } from './firebaseAdmin';
import { COLLECTIONS, VoteLedgerUser } from '@/config/firebase-init';

export interface AdminSetupConfig {
  cnic: string;
  email: string;
  password: string;
  name: string;
}

/**
 * Get admin configuration from environment variables
 */
export function getAdminConfig(): AdminSetupConfig | null {
  const cnic = process.env.ADMIN_CNIC;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!cnic || !email || !password || !name) {
    console.log('⚠️  Admin credentials not found in environment variables');
    console.log('   Set ADMIN_CNIC, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env.local');
    return null;
  }

  return { cnic, email, password, name };
}

/**
 * Check if admin user exists
 */
export async function checkAdminExists(cnic: string): Promise<VoteLedgerUser | null> {
  try {
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return null;
    }

    const querySnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('cnic', '==', cnic)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as VoteLedgerUser;
    }

    return null;
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return null;
  }
}

/**
 * Create admin user in Firebase Auth and Firestore
 */
export async function createAdminUser(config: AdminSetupConfig): Promise<{ success: boolean; user?: VoteLedgerUser; error?: string }> {
  try {
    if (!adminAuth || !adminDb) {
      return { success: false, error: 'Firebase Admin SDK not initialized' };
    }

    // Check if user already exists
    const existingUser = await checkAdminExists(config.cnic);
    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.email);
      return { success: true, user: existingUser };
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: config.email,
      password: config.password,
      displayName: config.name,
    });

    console.log('✅ Created Firebase Auth user:', userRecord.uid);

    // Create user profile in Firestore
    const userProfile: VoteLedgerUser = {
      uid: userRecord.uid,
      name: config.name,
      cnic: config.cnic,
      email: config.email,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userProfile);

    console.log('✅ Created admin user profile in Firestore');
    console.log('📧 Email:', config.email);
    console.log('🆔 CNIC:', config.cnic);
    console.log('👤 Name:', config.name);

    return { success: true, user: userProfile };
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Setup admin user from environment variables
 */
export async function setupAdminFromEnv(): Promise<{ success: boolean; user?: VoteLedgerUser; error?: string }> {
  const config = getAdminConfig();
  
  if (!config) {
    return { 
      success: false, 
      error: 'Admin configuration not found in environment variables' 
    };
  }

  console.log('🔧 Setting up admin user from environment variables...');
  return await createAdminUser(config);
}

/**
 * CLI function to setup admin (can be called from scripts)
 */
export async function setupAdminCLI() {
  console.log('🚀 Vote Ledger Admin Setup');
  console.log('========================');
  
  const result = await setupAdminFromEnv();
  
  if (result.success && result.user) {
    console.log('✅ Admin setup completed successfully!');
    console.log('📧 Login with:', result.user.email);
    console.log('🆔 CNIC:', result.user.cnic);
  } else {
    console.log('❌ Admin setup failed:', result.error);
    console.log('');
    console.log('💡 Make sure you have these environment variables set:');
    console.log('   ADMIN_CNIC=12345-1234567-1');
    console.log('   ADMIN_EMAIL=admin@voteledger.com');
    console.log('   ADMIN_PASSWORD=SecureAdmin123!');
    console.log('   ADMIN_NAME=System Administrator');
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupAdminCLI().catch(console.error);
}
