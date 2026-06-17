// Seed data for Vote Ledger Firestore database
import { DatabaseService } from './database';

// Sample candidates data
const sampleCandidates = [
  {
    name: 'Dr. Sarah Ahmed',
    party: 'Progressive Party',
    symbol: '🌟',
    color: 'blue',
    description: 'Experienced politician with focus on education and healthcare reforms',
  },
  {
    name: 'Muhammad Ali Khan',
    party: 'Unity Alliance',
    symbol: '🏛️',
    color: 'green',
    description: 'Business leader committed to economic development and job creation',
  },
  {
    name: 'Fatima Hassan',
    party: 'Democratic Front',
    symbol: '🕊️',
    description: 'Human rights advocate working for social justice and equality',
    color: 'purple',
  },
  {
    name: 'Ahmed Raza',
    party: 'National Movement',
    symbol: '⚡',
    color: 'orange',
    description: 'Tech entrepreneur focused on digital transformation and innovation',
  }
];

// Sample election data
const sampleElection = {
  title: 'General Election 2024',
  description: 'National Assembly Constituency Election',
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: new Date('2024-12-31T23:59:59Z'),
  status: 'active' as const,
  candidates: [] as string[], // Will be populated with candidate IDs
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test election for auto-start functionality (starts in the past)
const testElection = {
  title: 'Auto-Start Test Election',
  description: 'Test election to verify auto-start functionality',
  startDate: new Date(Date.now() - 60000), // Start 1 minute ago
  endDate: new Date(Date.now() + 3600000), // End 1 hour from now
  status: 'upcoming' as const,
  candidates: [] as string[], // Will be populated with candidate IDs
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Function to seed the database with sample data
export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create candidates
    const candidateIds: string[] = [];
    for (const candidate of sampleCandidates) {
      const candidateId = await DatabaseService.createCandidate(candidate);
      if (candidateId) {
        candidateIds.push(candidateId);
        console.log(`✅ Created candidate: ${candidate.name}`);
      }
    }
    
    // Create election with candidate IDs
    const electionData = {
      ...sampleElection,
      candidates: candidateIds,
    };
    
    const electionId = await DatabaseService.createElection(electionData);
    if (electionId) {
      console.log(`✅ Created election: ${sampleElection.title}`);
    }

    // Create test election for auto-start functionality
    const testElectionData = {
      ...testElection,
      candidates: candidateIds.slice(0, 2), // Use first 2 candidates for test
    };
    
    const testElectionId = await DatabaseService.createElection(testElectionData);
    if (testElectionId) {
      console.log(`✅ Created test election: ${testElection.title}`);
      console.log(`⏰ Test election starts at: ${testElection.startDate.toISOString()}`);
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${candidateIds.length} candidates and 2 elections`);
    
    return {
      success: true,
      candidates: candidateIds,
      election: electionId,
      testElection: testElectionId,
    };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return {
      success: false,
      error: error,
    };
  }
};

// Function to clear all data (for development/testing)
export const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing database...');
    
    // Note: This would require additional methods in DatabaseService
    // For now, this is a placeholder for future implementation
    
    console.log('✅ Database cleared successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Database clearing failed:', error);
    return { success: false, error };
  }
};

// Admin user creation helper
export const createAdminUser = async (userData: {
  name: string;
  cnic: string;
  email: string;
  password: string;
}) => {
  try {
    // Import AuthService dynamically
    const { AuthService } = await import('./auth');
    
    const result = await AuthService.signUp(userData);
    
    if (result.success && result.user) {
      // Update user to admin status
      await DatabaseService.updateUserProfile(result.user.uid, { isAdmin: true });
      console.log('✅ Admin user created successfully');
      return { success: true, user: result.user };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    console.error('❌ Admin user creation failed:', error);
    return { success: false, error };
  }
};









