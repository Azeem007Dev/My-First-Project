#!/usr/bin/env node

/**
 * Setup Admin User Script
 * 
 * Creates ONE admin user from environment variables
 * After admin is created, no more admins can be made
 * Run with: npm run setup-admin
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson.trim());
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT configuration');
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp();
  } else if (projectId) {
    console.warn('⚠️  No Admin SDK credentials found. Initializing with project ID only.');
    return admin.initializeApp({
      projectId: projectId,
    });
  } else {
    throw new Error(
      'Firebase Admin SDK credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS environment variable.'
    );
  }
}

// Get admin configuration from environment variables
function getAdminConfig() {
  const cnic = process.env.ADMIN_CNIC;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!cnic || !email || !password || !name) {
    throw new Error('Missing required environment variables. Set ADMIN_CNIC, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env.local');
  }

  return { cnic, email, password, name };
}

// Check if admin already exists in the system
async function checkAdminExists() {
  try {
    const db = admin.firestore();
    
    // Check system config
    const configDoc = await db.collection('system').doc('config').get();
    if (configDoc.exists && configDoc.data().adminInitialized === true) {
      return { exists: true, reason: 'Admin already initialized in system' };
    }

    // Check for any admin users
    const adminQuery = await db
      .collection('users')
      .where('isAdmin', '==', true)
      .limit(1)
      .get();

    if (!adminQuery.empty) {
      const adminUser = adminQuery.docs[0].data();
      return { 
        exists: true, 
        reason: 'Admin user already exists',
        user: adminUser
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking admin existence:', error);
    throw error;
  }
}

// Check if user exists by email in Firebase Auth
async function getUserByEmail(email) {
  try {
    const auth = admin.auth();
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

// Create admin user in Firebase Auth and Firestore
async function seedAdminUser(config) {
  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // Check if admin already exists
    console.log('🔍 Checking if admin already exists...');
    const adminCheck = await checkAdminExists();
    
    if (adminCheck.exists) {
      console.log('⚠️  Admin already exists:', adminCheck.reason);
      if (adminCheck.user) {
        console.log('📧 Existing Admin Email:', adminCheck.user.email);
        console.log('👤 Existing Admin Name:', adminCheck.user.name);
      }
      console.log('');
      console.log('🚫 Cannot create another admin. Only ONE admin is allowed.');
      console.log('💡 If you need to reset the admin, delete the existing admin user first.');
      return { success: false, error: 'Admin already exists. Only one admin allowed.' };
    }

    // Check if user with this email exists
    let authUser = await getUserByEmail(config.email);
    let userRecord;

    if (authUser) {
      console.log('✅ User exists in Firebase Auth, converting to admin...');
      userRecord = authUser;
      
      // Delete any existing non-admin data
      const existingDoc = await db.collection('users').doc(authUser.uid).get();
      if (existingDoc.exists && existingDoc.data().isAdmin !== true) {
        await db.collection('users').doc(authUser.uid).delete();
        console.log('🗑️  Removed existing non-admin user data');
      }
    } else {
      // Create new Firebase Auth user
      console.log('🆕 Creating new admin user in Firebase Auth...');
      userRecord = await auth.createUser({
        email: config.email,
        password: config.password,
        displayName: config.name,
      });
      console.log('✅ Created Firebase Auth user:', userRecord.uid);
    }

    // Set custom claims for admin authorization
    await auth.setCustomUserClaims(userRecord.uid, { isAdmin: true });
    console.log('✅ Set admin custom claims in Firebase Auth');

    // Create admin profile in Firestore
    const adminProfile = {
      uid: userRecord.uid,
      name: config.name,
      cnic: config.cnic,
      email: config.email,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(adminProfile);
    console.log('✅ Created admin user profile in Firestore');

    // Mark system as admin initialized (prevent future admin creation)
    await db.collection('system').doc('config').set({
      adminInitialized: true,
      adminEmail: config.email,
      adminCreatedAt: new Date(),
      lastUpdatedAt: new Date(),
    }, { merge: true });
    console.log('✅ Marked system as admin-initialized');

    console.log('📧 Email:', config.email);
    console.log('🆔 CNIC:', config.cnic);
    console.log('👤 Name:', config.name);

    return { success: true, user: adminProfile };
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    return { success: false, error: error.message };
  }
}

// CLI function to setup admin
async function setupAdminCLI() {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🚀 Vote Ledger Admin Setup');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('⚠️  IMPORTANT: Only ONE admin can be created');
  console.log('   After setup, no more admins can be made');
  console.log('');
  
  try {
    // Initialize Firebase Admin
    initAdmin();
    console.log('✅ Firebase Admin SDK initialized');
    console.log('');

    // Get admin config from environment
    const config = getAdminConfig();
    console.log('📋 Admin Configuration:');
    console.log('   Email:', config.email);
    console.log('   Name:', config.name);
    console.log('   CNIC:', config.cnic);
    console.log('');
    
    // Seed the admin user
    const result = await seedAdminUser(config);
    
    if (result.success && result.user) {
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('✅ Admin User Successfully Created!');
      console.log('═══════════════════════════════════════');
      console.log('');
      console.log('📧 Email:', result.user.email);
      console.log('🆔 CNIC:', result.user.cnic);
      console.log('👤 Name:', result.user.name);
      console.log('🔐 Admin Status: TRUE');
      console.log('🔒 System Locked: No more admins can be created');
      console.log('');
      console.log('💡 Login at /signin with:');
      console.log('   Email:', result.user.email);
      console.log('   Password: (from your .env.local)');
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('');
    } else {
      console.log('');
      console.log('═══════════════════════════════════════');
      console.log('❌ Admin Setup Failed');
      console.log('═══════════════════════════════════════');
      console.log('');
      console.log('Error:', result.error);
      console.log('');
      if (result.error.includes('already exists')) {
        console.log('💡 The system already has an admin user.');
        console.log('   Only ONE admin is allowed per system.');
      } else {
        console.log('💡 Make sure your .env.local has:');
        console.log('   ADMIN_CNIC=12345-1234567-1');
        console.log('   ADMIN_EMAIL=admin@voteledger.com');
        console.log('   ADMIN_PASSWORD=SecureAdmin123!');
        console.log('   ADMIN_NAME=System Administrator');
      }
      console.log('');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ Fatal Error');
    console.error('═══════════════════════════════════════');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Run setup
setupAdminCLI().catch(console.error);
