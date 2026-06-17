/**
 * Test Firebase Admin SDK connectivity
 * Run with: node scripts/test-firebase-admin.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
function initAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp();
  } else {
    return admin.initializeApp();
  }
}

async function testConnection() {
  try {
    console.log('🔍 Testing Firebase Admin SDK connection...\n');
    
    const app = initAdmin();
    const db = app.firestore();
    
    // Test users collection
    console.log('📊 Checking users collection...');
    const usersSnapshot = await db.collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const adminUsers = allUsers.filter(user => user.isAdmin);
    const regularVoters = allUsers.filter(user => !user.isAdmin);
    
    console.log(`✅ Found ${usersSnapshot.size} total user(s) in database`);
    console.log(`   - ${regularVoters.length} voter(s) (non-admin)`);
    console.log(`   - ${adminUsers.length} admin(s) (excluded from voter stats)`);
    
    if (usersSnapshot.size > 0) {
      console.log('\n👥 Users:');
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const badge = data.isAdmin ? '👑 Admin' : '🗳️  Voter';
        console.log(`  ${badge} - ${data.name} (${data.cnic})`);
      });
    }
    
    // Test elections collection
    console.log('\n📊 Checking elections collection...');
    const electionsSnapshot = await db.collection('elections').get();
    console.log(`✅ Found ${electionsSnapshot.size} election(s) in database`);
    
    if (electionsSnapshot.size > 0) {
      console.log('\n🗳️  Elections:');
      electionsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.title} - Status: ${data.status}`);
      });
    }
    
    // Test candidates collection
    console.log('\n📊 Checking candidates collection...');
    const candidatesSnapshot = await db.collection('candidates').get();
    console.log(`✅ Found ${candidatesSnapshot.size} candidate(s) in database`);
    
    if (candidatesSnapshot.size > 0) {
      console.log('\n🎯 Candidates:');
      candidatesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.symbol} ${data.name} (${data.party})`);
      });
    }
    
    // Test votes collection
    console.log('\n📊 Checking votes collection...');
    const votesSnapshot = await db.collection('votes').get();
    console.log(`✅ Found ${votesSnapshot.size} vote(s) in database`);
    
    console.log('\n✅ Firebase Admin SDK is working correctly!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing Firebase Admin:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure FIREBASE_SERVICE_ACCOUNT is set in .env.local');
    console.error('   2. Check that your service account JSON is valid');
    console.error('   3. Verify Firebase project settings');
    process.exit(1);
  }
}

testConnection();

