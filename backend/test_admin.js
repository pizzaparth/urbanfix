import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found');
      process.exit(1);
    }
    
    // Generate token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Find a pending complaint
    const complaint = await Complaint.findOne({ status: 'Pending' }).populate('citizenId');
    if (!complaint) {
      console.log('No pending complaint found');
      process.exit(1);
    }
    
    console.log(`Testing admin action for complaint ${complaint._id}`);
    
    // Make request using fetch
    const res = await fetch(`http://127.0.0.1:5001/api/admin/complaints/${complaint._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'In Progress',
        remarks: 'This is a test remark with >10 chars'
      })
    });
    
    const data = await res.json();
    console.log('Response:', res.status, data);
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

test();
