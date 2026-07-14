/**
 * Seed script — creates demo accounts for testing
 * Run: node scripts/seed.js
 */

import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('Missing MONGODB_URI'); process.exit(1); }

const demoUsers = [
  { email: 'admin@demo.com', name: 'Admin User', role: 'admin', phone: '+91 9000000001' },
  { email: 'patient@demo.com', name: 'Rahul Mehta', role: 'patient', phone: '+91 9000000002' },
  { email: 'doctor@demo.com', name: 'Priya Sharma', role: 'doctor', phone: '+91 9000000003' },
  { email: 'patient2@demo.com', name: 'Aisha Khan', role: 'patient', phone: '+91 9000000004' },
];

const demoDoctorProfile = {
  specialisation: 'Cardiology',
  bio: 'Dr. Priya Sharma is a senior cardiologist with 12 years of experience at AIIMS Delhi. She specialises in interventional cardiology and preventive heart care.',
  experience: 12,
  qualifications: ['MBBS', 'MD Cardiology', 'DM Interventional Cardiology'],
  workingHours: [
    { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '13:00', isAvailable: true },
    { day: 'Thursday', startTime: '10:00', endTime: '18:00', isAvailable: true },
    { day: 'Friday', startTime: '09:00', endTime: '16:00', isAvailable: true },
  ],
  slotDurationMinutes: 30,
  consultationFee: 1500,
  rating: 4.8,
  totalReviews: 127,
  isActive: true,
};

async function seed() {
  console.log('🌱 Starting seed...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('healthcare_manager');

  // Better Auth creates users in these collections
  const usersCol = db.collection('user');

  for (const user of demoUsers) {
    const existing = await usersCol.findOne({ email: user.email });
    if (!existing) {
      console.log(`Creating user: ${user.email}`);
      // Note: Better Auth manages auth internally; we insert minimal user data
      // For production, use Better Auth's signUp.email API
      await usersCol.insertOne({
        ...user,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      console.log(`User already exists: ${user.email}`);
      // Ensure role is set
      await usersCol.updateOne({ email: user.email }, { $set: { role: user.role } });
    }
  }

  // Create doctor profile
  const doctorUser = await usersCol.findOne({ email: 'doctor@demo.com' });
  if (doctorUser) {
    const doctorsCol = db.collection('doctors');
    const existing = await doctorsCol.findOne({ userId: doctorUser._id });
    if (!existing) {
      console.log('Creating demo doctor profile...');
      await doctorsCol.insertOne({ ...demoDoctorProfile, userId: doctorUser._id, createdAt: new Date(), updatedAt: new Date() });
    }
  }

  await client.close();
  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:   admin@demo.com / Demo@1234');
  console.log('  Patient: patient@demo.com / Demo@1234');
  console.log('  Doctor:  doctor@demo.com / Demo@1234');
  console.log('');
  console.log('Note: Passwords must be set via the registration form on first login.');
}

seed().catch(console.error);
