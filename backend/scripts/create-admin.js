const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { sequelize, User } = require('../models');

dotenv.config();

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const email = process.env.ADMIN_EMAIL || 'admin@rmu.edu.gh';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const lastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if admin already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`✅ Admin user already exists: ${email}`);
        console.log(`   Password: ${password}`);
        return;
      } else {
        // Update existing user to admin
        existing.role = 'admin';
        existing.isEmailVerified = true;
        const hashed = await bcrypt.hash(password, 10);
        existing.password = hashed;
        await existing.save();
        console.log(`✅ Updated user to admin: ${email}`);
        console.log(`   Password: ${password}`);
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
    console.log('Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('You can now login at http://localhost:3000/login');
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
