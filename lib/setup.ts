// Setup script for Vote Ledger Firebase integration
import { seedDatabase, createAdminUser } from './seed-data';

// Main setup function
export const setupVoteLedger = async () => {
  console.log('🚀 Setting up Vote Ledger...');
  
  try {
    // Create admin user
    const adminResult = await createAdminUser({
      name: 'Admin User',
      cnic: '12345-1234567-1',
      email: 'admin@voteleger.com',
      password: 'admin123',
    });
    
    if (adminResult.success) {
      console.log('✅ Admin user created');
    } else {
      console.log('⚠️ Admin user creation failed or already exists');
    }
    
    // Seed database with sample data
    const seedResult = await seedDatabase();
    
    if (seedResult.success) {
      console.log('✅ Sample data seeded successfully');
    } else {
      console.log('❌ Sample data seeding failed');
    }
    
    console.log('🎉 Vote Ledger setup completed!');
    
    return {
      success: true,
      adminCreated: adminResult.success,
      dataSeeded: seedResult.success,
    };
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return {
      success: false,
      error,
    };
  }
};

// Development setup with demo data
export const setupDevelopment = async () => {
  console.log('🛠️ Setting up development environment...');
  
  // Create demo users
  const demoUsers = [
    {
      name: 'Demo Voter',
      cnic: '98765-9876543-2',
      email: 'demo@voteleger.com',
      password: 'user123',
    },
  ];
  
  for (const userData of demoUsers) {
    const { AuthService } = await import('./auth');
    const result = await AuthService.signUp(userData);
    
    if (result.success) {
      console.log(`✅ Created demo user: ${userData.name}`);
    } else {
      console.log(`⚠️ Demo user creation failed: ${result.error}`);
    }
  }
  
  // Seed sample data
  await seedDatabase();
  
  console.log('🎉 Development setup completed!');
};









