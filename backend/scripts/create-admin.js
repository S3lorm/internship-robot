const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { User } = require('../models/supabase');

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');
    console.log('');

    // Fixed admin credentials - you can change these if needed
    const email = process.env.ADMIN_EMAIL || 'admin@rmu.edu.gh';
    const password = process.env.ADMIN_PASSWORD || 'Admin@2024';
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'admin') {
        // Update password to ensure it matches
        const hashed = await bcrypt.hash(password, 10);
        await User.update(existing.id, {
          password: hashed,
          isEmailVerified: true,
          isActive: true,
        });
        console.log(`✅ Admin user already exists - password updated`);
        console.log('');
        console.log('📋 Login Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('');
        console.log('🌐 Login at: http://localhost:3000/login');
        return;
      } else {
        // Update existing user to admin
        const hashed = await bcrypt.hash(password, 10);
        await User.update(existing.id, {
          role: 'admin',
          password: hashed,
          isEmailVerified: true,
          isActive: true,
        });
        console.log(`✅ Updated user to admin: ${email}`);
        console.log('');
        console.log('📋 Login Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('');
        console.log('🌐 Login at: http://localhost:3000/login');
        return;
      }
    }

    // Create new admin user
    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/login');
    console.log('');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('   You can change the password after logging in.');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    console.error('   Details:', error.message);
    process.exit(1);
  }
}

createAdmin();
