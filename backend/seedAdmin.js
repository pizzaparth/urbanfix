import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_system';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    const adminEmail = 'admin@complaintsystem.gov';
    const adminPassword = 'admin_password_123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user already exists with email: ${adminEmail}`);
      process.exit(0);
    }

    // Creating user (the pre-save hook in User.js will hash the password)
    await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      phone: '9999999999',
      role: 'admin',
      isVerified: true,
    });

    console.log('\n======================================');
    console.log('Default Admin User Seeded Successfully!');
    console.log('======================================');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('======================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
