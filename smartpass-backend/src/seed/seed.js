require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User');
const Card = require('../models/Card');
const Wallet = require('../models/Wallet');
const ClassSchedule = require('../models/ClassSchedule');
const EmergencyProfile = require('../models/EmergencyProfile');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Card.deleteMany({});
    await Wallet.deleteMany({});
    await ClassSchedule.deleteMany({});
    await EmergencyProfile.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Admin Account (Teaching account only - MUST change before production)
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@smartpass.edu',
      password: adminPasswordHash,
      role: 'admin',
      phone: '0901234567',
      isActive: true,
    });
    await Wallet.create({ owner: admin._id, balance: 500000 });
    console.log(`Created admin: ${admin.email}`);

    // 2. Create 2 Students
    const student1PasswordHash = await bcrypt.hash('Student@123', 10);
    const student1 = await User.create({
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@smartpass.edu',
      password: student1PasswordHash,
      role: 'student',
      phone: '0912345678',
      studentCode: 'STU001',
      className: 'SE101',
      isActive: true,
    });
    await Wallet.create({ owner: student1._id, balance: 150000 });

    const student2PasswordHash = await bcrypt.hash('Student@123', 10);
    const student2 = await User.create({
      fullName: 'Tran Thi Binh',
      email: 'binh.tran@smartpass.edu',
      password: student2PasswordHash,
      role: 'student',
      phone: '0987654321',
      studentCode: 'STU002',
      className: 'SE101',
      isActive: true,
    });
    await Wallet.create({ owner: student2._id, balance: 200000 });
    console.log(`Created students: ${student1.email}, ${student2.email}`);

    // 3. Create 1 Card per Student
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const card1 = await Card.create({
      cardCode: 'CARD-STU001',
      owner: student1._id,
      type: 'student',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: oneYearFromNow,
      nfcUid: 'NFC-AN-001',
      qrToken: crypto.randomBytes(32).toString('hex'),
    });

    const card2 = await Card.create({
      cardCode: 'CARD-STU002',
      owner: student2._id,
      type: 'student',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: oneYearFromNow,
      nfcUid: 'NFC-BINH-002',
      qrToken: crypto.randomBytes(32).toString('hex'),
    });
    console.log(`Created cards: ${card1.cardCode}, ${card2.cardCode}`);

    // 4. Create Emergency Profiles
    await EmergencyProfile.create({
      owner: student1._id,
      fullName: student1.fullName,
      emergencyContactName: 'Nguyen Van Cha (Father)',
      emergencyContactPhone: '0909998877',
      allergies: 'Penicillin, Peanuts',
      bloodType: 'O+',
      insuranceInfo: 'BHYT-123456789',
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone', 'bloodType'],
      isEnabled: true,
    });

    await EmergencyProfile.create({
      owner: student2._id,
      fullName: student2.fullName,
      emergencyContactName: 'Tran Van Me (Mother)',
      emergencyContactPhone: '0908887766',
      allergies: 'None',
      bloodType: 'A+',
      insuranceInfo: 'BHYT-987654321',
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone'],
      isEnabled: true,
    });
    console.log('Created emergency profiles.');

    // 5. Create Sample ClassSchedule Rows
    await ClassSchedule.create([
      {
        className: 'SE101',
        subject: 'Data Structures and Algorithms',
        teacher: 'Dr. Le Van Toan',
        room: 'Lab 302',
        dayOfWeek: 2, // Monday
        startTime: '08:00',
        endTime: '10:30',
        semester: 'Fall 2026',
      },
      {
        className: 'SE101',
        subject: 'Database Systems',
        teacher: 'Prof. Tran Minh',
        room: 'Room 405',
        dayOfWeek: 4, // Wednesday
        startTime: '13:00',
        endTime: '15:30',
        semester: 'Fall 2026',
      },
      {
        className: 'SE101',
        subject: 'Mobile Development (Android)',
        teacher: 'Nguyen Hoang',
        room: 'Lab 201',
        dayOfWeek: 6, // Friday
        startTime: '09:00',
        endTime: '11:30',
        semester: 'Fall 2026',
      },
    ]);
    console.log('Created sample ClassSchedule rows.');

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();

