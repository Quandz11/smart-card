require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User');
const Card = require('../models/Card');
const Wallet = require('../models/Wallet');
const CanteenTransaction = require('../models/CanteenTransaction');
const LibraryLoan = require('../models/LibraryLoan');
const RoomBooking = require('../models/RoomBooking');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ClassSchedule = require('../models/ClassSchedule');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const EmergencyProfile = require('../models/EmergencyProfile');
const ParkingSession = require('../models/ParkingSession');
const AccessLog = require('../models/AccessLog');

// Deterministic PRNG using Mulberry32
function createPrng(seed = 20261111) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const prng = createPrng(20261111);

function randInt(min, max) {
  return Math.floor(prng() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(prng() * arr.length)];
}

const SURNAMES = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly'];
const MIDDLES_MALE = ['Van', 'Duc', 'Minh', 'Gia', 'Thanh', 'Quang', 'Huu', 'Dinh', 'Tuan', 'Bao'];
const MIDDLES_FEMALE = ['Thi', 'Ngoc', 'Phuong', 'Thanh', 'Mai', 'Thuy', 'Khanh', 'Nhu', 'Quynh', 'Anh'];
const GIVENS_MALE = ['An', 'Binh', 'Cuong', 'Dung', 'Dat', 'Hai', 'Hieu', 'Huy', 'Khoa', 'Long', 'Nam', 'Phong', 'Phuc', 'Quan', 'Son', 'Thang', 'Tuan', 'Viet'];
const GIVENS_FEMALE = ['Anh', 'Chi', 'Dung', 'Ha', 'Hoa', 'Huong', 'Lan', 'Linh', 'Mai', 'My', 'Ngan', 'Nhi', 'Oanh', 'Thao', 'Trang', 'Van', 'Vy', 'Yen'];

function generateFullName(index) {
  const isFemale = index % 2 === 1;
  const surname = SURNAMES[index % SURNAMES.length];
  const middle = isFemale
    ? MIDDLES_FEMALE[(index * 3) % MIDDLES_FEMALE.length]
    : MIDDLES_MALE[(index * 3) % MIDDLES_MALE.length];
  const given = isFemale
    ? GIVENS_FEMALE[(index * 7) % GIVENS_FEMALE.length]
    : GIVENS_MALE[(index * 7) % GIVENS_MALE.length];
  return `${surname} ${middle} ${given}`;
}

const CLASSES = ['SE101', 'SE102', 'CS101', 'CS102', 'AI101', 'DS101'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ALLERGIES_LIST = ['None', 'None', 'None', 'Penicillin', 'Peanuts', 'Seafood', 'Dust & Pollen', 'Aspirin'];

const BOOK_TITLES = [
  { code: 'BK-001', title: 'Clean Code: A Handbook of Agile Software Craftsmanship' },
  { code: 'BK-002', title: 'Design Patterns: Elements of Reusable Object-Oriented Software' },
  { code: 'BK-003', title: 'Introduction to Algorithms (CLRS 4th Edition)' },
  { code: 'BK-004', title: 'Computer Networks: A Systems Approach' },
  { code: 'BK-005', title: 'Modern Operating Systems (Andrew S. Tanenbaum)' },
  { code: 'BK-006', title: 'Artificial Intelligence: A Modern Approach' },
  { code: 'BK-007', title: 'Database System Concepts (Silberschatz)' },
  { code: 'BK-008', title: 'Cracking the Coding Interview' },
  { code: 'BK-009', title: 'Designing Data-Intensive Applications (Martin Kleppmann)' },
  { code: 'BK-010', title: 'The Pragmatic Programmer: Your Journey To Mastery' },
  { code: 'BK-011', title: 'Head First Design Patterns' },
  { code: 'BK-012', title: 'Kotlin in Action' },
  { code: 'BK-013', title: 'Android Programming: The Big Nerd Ranch Guide' },
  { code: 'BK-014', title: 'Site Reliability Engineering (Google SRE)' },
  { code: 'BK-015', title: 'Structure and Interpretation of Computer Programs' }
];

const CANTEEN_ITEMS = [
  { note: 'Cơm sườn nướng mật ong', amount: 35000 },
  { note: 'Phở bò tái nạm', amount: 40000 },
  { note: 'Bún chả Hà Nội', amount: 35000 },
  { note: 'Cơm gà xối mỡ', amount: 38000 },
  { note: 'Bánh mì thịt nướng pate', amount: 25000 },
  { note: 'Cà phê sữa đá Sài Gòn', amount: 18000 },
  { note: 'Trà đào cam sả', amount: 25000 },
  { note: 'Trà sữa trân châu hoàng gia', amount: 30000 },
  { note: 'Nước ép cam tươi', amount: 22000 },
  { note: 'Nước khoáng đóng chai', amount: 10000 }
];

const ROOM_LIST = [
  'Phòng học nhóm A101', 'Phòng học nhóm A102', 'Phòng Lab Tin học B201',
  'Phòng Lab Tin học B202', 'Hội trường Thư viện C301', 'Phòng Nghiên cứu D101'
];

async function seedRich() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[ERROR] MONGO_URI is missing from environment.');
    process.exit(1);
  }

  // Safety check on database name
  let dbName = 'smartpass';
  try {
    const match = uri.match(/\/([a-zA-Z0-9_\-]+)(?:\?|$)/);
    if (match && match[1]) {
      dbName = match[1];
    }
  } catch (_) {}

  const isSafeDb = dbName.endsWith('_dev') || dbName.endsWith('_test') || dbName.endsWith('_seed');
  if (!isSafeDb && process.env.FORCE_SEED !== '1') {
    console.error(`\n========================================================================`);
    console.error(`[SAFETY GUARD ERROR] Target database is "${dbName}".`);
    console.error(`Target database name does not end in _dev, _test, or _seed.`);
    console.error(`To execute rich seeding on this database, you MUST specify FORCE_SEED=1`);
    console.error(`Example: FORCE_SEED=1 npm run seed:rich`);
    console.error(`========================================================================\n`);
    process.exit(1);
  }

  console.log(`[SEED] Connecting to MongoDB (${dbName})...`);
  await mongoose.connect(uri);
  console.log('[SEED] Connected successfully.');

  // Idempotency: Clean up all previous seed records
  console.log('[SEED] Cleaning up previous SP-SEED data...');
  const existingSeedUsers = await User.find({
    $or: [
      { email: { $regex: /@seed\.smartpass\.local$/ } },
      { studentCode: { $regex: /^SP-SEED-/ } }
    ]
  }).select('_id');

  const seedUserIds = existingSeedUsers.map((u) => u._id);

  if (seedUserIds.length > 0) {
    await Card.deleteMany({ owner: { $in: seedUserIds } });
    await Wallet.deleteMany({ owner: { $in: seedUserIds } });
    await CanteenTransaction.deleteMany({ owner: { $in: seedUserIds } });
    await LibraryLoan.deleteMany({ borrower: { $in: seedUserIds } });
    await RoomBooking.deleteMany({ bookedBy: { $in: seedUserIds } });
    await Attendance.deleteMany({ student: { $in: seedUserIds } });
    await EventRegistration.deleteMany({ student: { $in: seedUserIds } });
    await Notification.deleteMany({ receiver: { $in: seedUserIds } });
    await EmergencyProfile.deleteMany({ owner: { $in: seedUserIds } });
    await ParkingSession.deleteMany({ owner: { $in: seedUserIds } });
    await AccessLog.deleteMany({ owner: { $in: seedUserIds } });
    await User.deleteMany({ _id: { $in: seedUserIds } });
  }

  await Event.deleteMany({ title: { $regex: /^\[SEED\]/ } });
  await ClassSchedule.deleteMany({ semester: 'Seed Fall 2026' });

  console.log('[SEED] Cleaned previous seed data.');

  // Pre-hash passwords once
  console.log('[SEED] Generating bcrypt password hashes...');
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const librarianHash = await bcrypt.hash('Librarian@123', 10);
  const canteenHash = await bcrypt.hash('Canteen@123', 10);
  const parkingHash = await bcrypt.hash('Parking@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  // 1. Staff & Admin Accounts
  console.log('[SEED] Creating Staff & Admin accounts...');
  const adminUser = await User.create({
    fullName: 'System Administrator (Seed)',
    email: 'admin@seed.smartpass.local',
    password: adminHash,
    role: 'admin',
    phone: '0901000001',
    isActive: true
  });
  await Wallet.create({ owner: adminUser._id, balance: 1000000 });

  const librarianUser = await User.create({
    fullName: 'Thu Vien Vien - Nguyen Thi Mai',
    email: 'librarian@seed.smartpass.local',
    password: librarianHash,
    role: 'librarian',
    phone: '0901000002',
    isActive: true
  });
  await Wallet.create({ owner: librarianUser._id, balance: 500000 });

  const canteenStaff1 = await User.create({
    fullName: 'Nhan Vien Cang Tin 1 - Tran Van Bep',
    email: 'canteen1@seed.smartpass.local',
    password: canteenHash,
    role: 'canteen_staff',
    phone: '0901000003',
    isActive: true
  });
  await Wallet.create({ owner: canteenStaff1._id, balance: 500000 });

  const canteenStaff2 = await User.create({
    fullName: 'Nhan Vien Cang Tin 2 - Le Thi Thu Ngan',
    email: 'canteen2@seed.smartpass.local',
    password: canteenHash,
    role: 'canteen_staff',
    phone: '0901000004',
    isActive: true
  });
  await Wallet.create({ owner: canteenStaff2._id, balance: 500000 });

  const parkingStaff1 = await User.create({
    fullName: 'Nhan Vien Giu Xe 1 - Pham Van Cong',
    email: 'parking1@seed.smartpass.local',
    password: parkingHash,
    role: 'parking_staff',
    phone: '0901000005',
    isActive: true
  });
  await Wallet.create({ owner: parkingStaff1._id, balance: 500000 });

  const parkingStaff2 = await User.create({
    fullName: 'Nhan Vien Giu Xe 2 - Hoang Van An Ninh',
    email: 'parking2@seed.smartpass.local',
    password: parkingHash,
    role: 'parking_staff',
    phone: '0901000006',
    isActive: true
  });
  await Wallet.create({ owner: parkingStaff2._id, balance: 500000 });

  // 2. 120 Students
  console.log('[SEED] Creating 120 students across 6 classes...');
  const studentDocs = [];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  for (let i = 1; i <= 120; i++) {
    const pad = String(i).padStart(3, '0');
    const className = CLASSES[(i - 1) % CLASSES.length];
    const fullName = generateFullName(i);
    const phone = `0987${String(100000 + i).slice(1)}`;

    studentDocs.push({
      fullName,
      email: `student${pad}@seed.smartpass.local`,
      password: studentHash,
      role: 'student',
      phone,
      studentCode: `SP-SEED-STU${pad}`,
      className,
      isActive: true
    });
  }

  const createdStudents = await User.insertMany(studentDocs);

  // Wallets, Cards, Emergency Profiles for students
  const walletDocs = [];
  const cardDocs = [];
  const emergencyDocs = [];

  for (let i = 0; i < createdStudents.length; i++) {
    const s = createdStudents[i];
    const pad = String(i + 1).padStart(3, '0');
    const balance = randInt(5, 50) * 10000; // 50.000 to 500.000 VND

    walletDocs.push({
      owner: s._id,
      balance
    });

    // Deterministic 64-character hex QR token
    const qrToken = crypto.createHash('sha256').update(`SP-SEED-QR-TOKEN-${pad}-20261111`).digest('hex');

    cardDocs.push({
      cardCode: `SP-SEED-CARD${pad}`,
      owner: s._id,
      type: 'student',
      status: i < 115 ? 'active' : (i === 115 ? 'locked' : (i === 116 ? 'expired' : 'lost')),
      issuedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      expiresAt: oneYearFromNow,
      nfcUid: `SP-SEED-NFC${pad}`,
      qrToken
    });

    emergencyDocs.push({
      owner: s._id,
      fullName: s.fullName,
      emergencyContactName: `Phu huynh cua ${s.fullName.split(' ').pop()}`,
      emergencyContactPhone: `0911${String(200000 + i).slice(1)}`,
      allergies: ALLERGIES_LIST[i % ALLERGIES_LIST.length],
      bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
      insuranceInfo: `BHYT-SEED-${pad}`,
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone', 'bloodType'],
      isEnabled: true
    });
  }

  const createdWallets = await Wallet.insertMany(walletDocs);
  const createdCards = await Card.insertMany(cardDocs);
  await EmergencyProfile.insertMany(emergencyDocs);

  // Map student ID to wallet ID and card ID
  const studentWalletMap = new Map();
  createdWallets.forEach((w) => studentWalletMap.set(w.owner.toString(), w));

  const studentCardMap = new Map();
  createdCards.forEach((c) => studentCardMap.set(c.owner.toString(), c));

  // 3. 600+ Canteen Transactions
  console.log('[SEED] Generating 650+ canteen transactions distributed over last 30 days...');
  const canteenTxDocs = [];
  const now = Date.now();

  for (let i = 0; i < createdStudents.length; i++) {
    const s = createdStudents[i];
    const w = studentWalletMap.get(s._id.toString());
    const txCount = randInt(5, 7); // ~120 * 5.5 = ~660 transactions

    let currentBalance = 200000;
    // Initial top-up transaction
    const topupTime = new Date(now - randInt(25, 30) * 24 * 3600 * 1000);
    canteenTxDocs.push({
      wallet: w._id,
      owner: s._id,
      type: 'topup',
      amount: 200000,
      balanceAfter: currentBalance,
      note: 'Nạp tiền ví căng tin đầu tháng (Tiền mặt / Thẻ ngân hàng)',
      createdBy: canteenStaff1._id,
      createdAt: topupTime,
      updatedAt: topupTime
    });

    for (let k = 0; k < txCount - 1; k++) {
      const item = randChoice(CANTEEN_ITEMS);
      const isTopUp = currentBalance < item.amount || (k === 3 && prng() > 0.6);

      const daysAgo = randInt(1, 24);
      const txTime = new Date(now - daysAgo * 24 * 3600 * 1000 + randInt(0, 3600 * 10) * 1000);

      if (isTopUp) {
        const topupAmt = randChoice([100000, 200000, 300000]);
        currentBalance += topupAmt;
        canteenTxDocs.push({
          wallet: w._id,
          owner: s._id,
          type: 'topup',
          amount: topupAmt,
          balanceAfter: currentBalance,
          note: 'Nạp tiền trực tiếp tại quầy thu ngân căng tin',
          createdBy: randChoice([canteenStaff1._id, canteenStaff2._id]),
          createdAt: txTime,
          updatedAt: txTime
        });
      } else {
        currentBalance -= item.amount;
        canteenTxDocs.push({
          wallet: w._id,
          owner: s._id,
          type: 'pay',
          amount: item.amount,
          balanceAfter: currentBalance,
          note: item.note,
          createdBy: randChoice([canteenStaff1._id, canteenStaff2._id]),
          createdAt: txTime,
          updatedAt: txTime
        });
      }
    }

    // Update wallet balance to match final balance
    await Wallet.updateOne({ _id: w._id }, { balance: Math.max(0, currentBalance) });
  }

  await CanteenTransaction.insertMany(canteenTxDocs);
  console.log(`[SEED] Created ${canteenTxDocs.length} canteen transactions.`);

  // 4. 150+ Library Loans
  console.log('[SEED] Generating 160+ library loans...');
  const loanDocs = [];
  for (let i = 0; i < 165; i++) {
    const s = createdStudents[i % createdStudents.length];
    const book = BOOK_TITLES[i % BOOK_TITLES.length];
    const daysAgo = randInt(2, 35);
    const borrowedAt = new Date(now - daysAgo * 24 * 3600 * 1000);
    const dueAt = new Date(borrowedAt.getTime() + 14 * 24 * 3600 * 1000);

    let status = 'borrowed';
    let returnedAt = null;

    if (daysAgo > 14) {
      if (i % 5 === 0) {
        status = 'overdue';
      } else {
        status = 'returned';
        returnedAt = new Date(borrowedAt.getTime() + randInt(3, 13) * 24 * 3600 * 1000);
      }
    } else {
      if (i % 3 === 0) {
        status = 'returned';
        returnedAt = new Date(borrowedAt.getTime() + randInt(1, 5) * 24 * 3600 * 1000);
      } else {
        status = 'borrowed';
      }
    }

    loanDocs.push({
      borrower: s._id,
      bookCode: book.code,
      bookTitle: book.title,
      borrowedAt,
      dueAt,
      returnedAt,
      status
    });
  }

  await LibraryLoan.insertMany(loanDocs);
  console.log(`[SEED] Created ${loanDocs.length} library loans.`);

  // 5. 80+ Room Bookings
  console.log('[SEED] Generating 85+ room bookings...');
  const bookingDocs = [];
  const PURPOSES = [
    'Họp nhóm đồ án tốt nghiệp K26',
    'Ôn thi cuối kỳ môn Cấu trúc dữ liệu & Giải thuật',
    'Thực hành lập trình thiết bị di động Android',
    'Họp CLB Tin học & Đổi mới sáng tạo',
    'Nghiên cứu khoa học sinh viên',
    'Chuẩn bị thuyết trình seminar chuyên ngành'
  ];
  const BOOKING_STATUSES = ['approved', 'approved', 'approved', 'pending', 'rejected', 'cancelled'];

  for (let i = 0; i < 88; i++) {
    const s = createdStudents[i % createdStudents.length];
    const room = ROOM_LIST[i % ROOM_LIST.length];
    const daysOffset = randInt(-10, 15);
    const date = new Date(now + daysOffset * 24 * 3600 * 1000);
    date.setHours(0, 0, 0, 0);

    const startH = randInt(8, 16);
    const startTime = `${String(startH).padStart(2, '0')}:00`;
    const endTime = `${String(startH + 2).padStart(2, '0')}:00`;
    const status = BOOKING_STATUSES[i % BOOKING_STATUSES.length];

    bookingDocs.push({
      room,
      bookedBy: s._id,
      date,
      startTime,
      endTime,
      purpose: PURPOSES[i % PURPOSES.length],
      status
    });
  }

  await RoomBooking.insertMany(bookingDocs);
  console.log(`[SEED] Created ${bookingDocs.length} room bookings.`);

  // 6. 15 Campus Events & Registrations
  console.log('[SEED] Generating 15 campus events & student registrations...');
  const EVENT_TEMPLATES = [
    { title: '[SEED] Smart Campus Hackathon 2026', desc: 'Cuộc thi sáng tạo giải pháp thông minh trong khuôn viên đại học.', loc: 'Hội trường C301', days: 5, cap: 100 },
    { title: '[SEED] Ngày hội việc làm CNTT & Chuyển đổi số', desc: 'Kết nối sinh viên với hơn 30 doanh nghiệp công nghệ hàng đầu.', loc: 'Sân vận động Trung tâm', days: 12, cap: 300 },
    { title: '[SEED] Workshop: AI & Modern Agentic Systems', desc: 'Tìm hiểu ứng dụng Generative AI và tự động hóa trong kỹ thuật phần mềm.', loc: 'Phòng Hội thảo B1', days: -3, cap: 80 },
    { title: '[SEED] Hội thảo An toàn thông tin & Bảo mật đám mây', desc: 'Chia sẻ từ các chuyên gia bảo mật hàng đầu về phòng thủ không gian mạng.', loc: 'Phòng Lab A201', days: 8, cap: 60 },
    { title: '[SEED] Giải bóng đá sinh viên SmartPass Cup', desc: 'Giải bóng đá truyền thống thường niên giữa các khoa viện.', loc: 'Sân bóng trường', days: 20, cap: 200 },
    { title: '[SEED] Ngày hội Hiến máu tình nguyện "Giọt hồng sẻ chia"', desc: 'Chương trình thiện nguyện hiến máu cứu người của Đoàn thanh niên.', loc: 'Sảnh nhà A', days: 2, cap: 150 },
    { title: '[SEED] Seminar: Kotlin Multiplatform & Jetpack Compose', desc: 'Xây dựng ứng dụng đa nền tảng hiện đại với Kotlin và Compose.', loc: 'Phòng C102', days: -10, cap: 70 },
    { title: '[SEED] Tọa đàm Khởi nghiệp Sinh viên 2026', desc: 'Giao lưu cùng các cựu sinh viên khởi nghiệp thành công.', loc: 'Hội trường Lớn', days: 18, cap: 120 },
    { title: '[SEED] Cuộc thi Lập trình thi đấu ICPC SmartPass', desc: 'Vòng sơ loại cuộc thi lập trình thuật toán sinh viên.', loc: 'Phòng Máy B202', days: 14, cap: 90 },
    { title: '[SEED] Triển lãm Đồ án Tốt nghiệp Xuất sắc', desc: 'Trưng bày các sản phẩm công nghệ nổi bật của sinh viên khóa cuối.', loc: 'Sảnh triển lãm B', days: -15, cap: 250 },
    { title: '[SEED] Workshop: Thiết kế UI/UX theo chuẩn Material 3', desc: 'Thực hành thiết kế trải nghiệm người dùng hiện đại.', loc: 'Phòng D102', days: 6, cap: 50 },
    { title: '[SEED] Tập huấn Kỹ năng mềm: Giao tiếp & Làm việc nhóm', desc: 'Trang bị kỹ năng thiết yếu cho sinh viên trước khi thực tập.', loc: 'Phòng A105', days: 10, cap: 100 },
    { title: '[SEED] Cuộc thi Thiết kế IoT & Smart Home', desc: 'Thiết kế hệ thống nhúng thông minh ứng dụng trong đời sống.', loc: 'Lab Phần cứng D2', days: 25, cap: 40 },
    { title: '[SEED] Giao lưu Văn hóa Quốc tế & Sinh viên Trao đổi', desc: 'Kết nối văn hóa, ẩm thực và ngôn ngữ cùng sinh viên quốc tế.', loc: 'Khuôn viên Thư viện', days: 30, cap: 180 },
    { title: '[SEED] Đêm nhạc Hội Chào tân sinh viên K26', desc: 'Đêm nhạc hội nghệ thuật đặc sắc chào đón tân sinh viên.', loc: 'Quảng trường Trường', days: -25, cap: 500 }
  ];

  const eventDocs = [];
  for (const t of EVENT_TEMPLATES) {
    const startAt = new Date(now + t.days * 24 * 3600 * 1000);
    const endAt = new Date(startAt.getTime() + 4 * 3600 * 1000);

    eventDocs.push({
      title: t.title,
      description: t.desc,
      location: t.loc,
      startAt,
      endAt,
      capacity: t.cap,
      registeredCount: 0
    });
  }

  const createdEvents = await Event.insertMany(eventDocs);

  // Generate registrations for events
  const regDocs = [];
  for (let eIdx = 0; eIdx < createdEvents.length; eIdx++) {
    const ev = createdEvents[eIdx];
    const numRegs = randInt(8, 25);
    for (let r = 0; r < numRegs; r++) {
      const student = createdStudents[(eIdx * 7 + r) % createdStudents.length];
      regDocs.push({
        event: ev._id,
        student: student._id,
        registeredAt: new Date(now - randInt(1, 10) * 24 * 3600 * 1000)
      });
    }
    await Event.updateOne({ _id: ev._id }, { registeredCount: numRegs });
  }

  await EventRegistration.insertMany(regDocs);
  console.log(`[SEED] Created ${createdEvents.length} events with ${regDocs.length} registrations.`);

  // 7. Class Schedules for all 6 classes
  console.log('[SEED] Generating ClassSchedules for 6 classes...');
  const scheduleDefs = [
    { sub: 'Lập trình Thiết bị Di động (Android)', teacher: 'ThS. Nguyen Hoang', room: 'Lab 201' },
    { sub: 'Cấu trúc Dữ liệu & Giải thuật', teacher: 'TS. Le Van Toan', room: 'Phòng 302' },
    { sub: 'Hệ quản trị Cơ sở Dữ liệu', teacher: 'PGS. Tran Minh', room: 'Phòng 405' },
    { sub: 'Mạng Máy tính & Truyền thông', teacher: 'ThS. Pham Van Hai', room: 'Lab 102' },
    { sub: 'Trí tuệ Nhân tạo Cơ bản', teacher: 'TS. Hoang Duc Thang', room: 'Phòng 501' },
    { sub: 'Kiến trúc & Thiết kế Phần mềm', teacher: 'TS. Dang Quoc Bao', room: 'Phòng 402' }
  ];

  const scheduleDocs = [];
  for (const cName of CLASSES) {
    for (let day = 2; day <= 6; day++) {
      const def = scheduleDefs[(day + cName.charCodeAt(3)) % scheduleDefs.length];
      const isMorning = (day + cName.charCodeAt(2)) % 2 === 0;

      scheduleDocs.push({
        className: cName,
        subject: def.sub,
        teacher: def.teacher,
        room: def.room,
        dayOfWeek: day, // 2: Monday, 3: Tuesday, 4: Wednesday, 5: Thursday, 6: Friday
        startTime: isMorning ? '08:00' : '13:30',
        endTime: isMorning ? '11:15' : '16:45',
        semester: 'Seed Fall 2026'
      });
    }
  }

  await ClassSchedule.insertMany(scheduleDocs);
  console.log(`[SEED] Created ${scheduleDocs.length} ClassSchedules.`);

  // 8. 50+ Parking Sessions
  console.log('[SEED] Generating 60+ parking sessions...');
  const parkingDocs = [];
  for (let i = 0; i < 65; i++) {
    const s = createdStudents[i % createdStudents.length];
    const card = studentCardMap.get(s._id.toString());
    const isOut = i % 4 !== 0; // 75% out, 25% currently in

    const hoursAgo = randInt(1, 48);
    const checkInAt = new Date(now - hoursAgo * 3600 * 1000);
    const checkOutAt = isOut ? new Date(checkInAt.getTime() + randInt(2, 8) * 3600 * 1000) : null;
    const fee = isOut ? 3000 : 0;
    const vehiclePlate = `${randChoice(['29', '30', '51', '43'])}${randChoice(['A', 'B', 'C', 'D'])}-${randInt(100, 999)}.${randInt(10, 99)}`;

    parkingDocs.push({
      card: card._id,
      owner: s._id,
      vehiclePlate,
      checkInAt,
      checkOutAt,
      fee,
      status: isOut ? 'out' : 'in'
    });
  }

  await ParkingSession.insertMany(parkingDocs);
  console.log(`[SEED] Created ${parkingDocs.length} parking sessions.`);

  // 9. 100+ Notifications
  console.log('[SEED] Generating 105+ notifications...');
  const notifDocs = [];
  const NOTIF_TEMPLATES = [
    { title: 'Nhắc nhở đóng học phí học kỳ Fall 2026', body: 'Thời hạn hoàn thành nghĩa vụ học phí đến hết ngày 30/11/2026. Sinh viên vui lòng kiểm tra ví SmartPass.', aud: 'all' },
    { title: 'Thông báo nghỉ học & học bù môn Cấu trúc Dữ liệu', body: 'Lớp SE101 được nghỉ buổi học thứ 4 và sẽ học bù vào thứ 7 tuần sau.', aud: 'class', cName: 'SE101' },
    { title: 'Cảnh báo sách mượn sắp đến hạn hoàn trả', body: 'Cuốn sách bạn mượn tại thư viện sắp đến hạn 14 ngày. Vui lòng trả sách đúng hạn để tránh phát sinh tiền phạt.', aud: 'individual' },
    { title: 'Đăng ký tham gia Hackathon Smart Campus', body: 'Cổng đăng ký Hackathon 2026 đã mở. Đăng ký nhóm ngay tại mục Sự kiện trong ứng dụng SmartPass.', aud: 'all' },
    { title: 'Cập nhật thực đơn Căng tin tuần mới', body: 'Căng tin trường ra mắt thực đơn mùa thu với nhiều món mới hấp dẫn và ưu đãi thanh toán thẻ.', aud: 'all' },
    { title: 'Lịch thi kết thúc học phần', body: 'Lịch thi chính thức đã được công bố trên cổng đào tạo. Sinh viên mang theo thẻ sinh viên SmartPass khi vào phòng thi.', aud: 'all' }
  ];

  for (let i = 0; i < 110; i++) {
    const tmpl = NOTIF_TEMPLATES[i % NOTIF_TEMPLATES.length];
    const s = createdStudents[i % createdStudents.length];

    notifDocs.push({
      title: tmpl.title,
      body: tmpl.body,
      audience: tmpl.aud,
      className: tmpl.aud === 'class' ? (tmpl.cName || CLASSES[i % CLASSES.length]) : undefined,
      receiver: tmpl.aud === 'individual' ? s._id : undefined,
      createdBy: adminUser._id
    });
  }

  await Notification.insertMany(notifDocs);
  console.log(`[SEED] Created ${notifDocs.length} notifications.`);

  // 10. 300+ AccessLogs
  console.log('[SEED] Generating 350+ AccessLogs...');
  const accessDocs = [];
  const ACCESS_ACTIONS = [
    { action: 'entry', loc: 'Cổng chính - Turnstile 01' },
    { action: 'exit', loc: 'Cổng chính - Turnstile 02' },
    { action: 'library_borrow', loc: 'Quầy mượn trả Thư viện tầng 2' },
    { action: 'canteen_pay', loc: 'Máy POS Quầy Căng tin 1' },
    { action: 'parking_in', loc: 'Trạm giữ xe Cổng Tây' },
    { action: 'attendance', loc: 'Điểm danh phòng Lab 201' }
  ];

  for (let i = 0; i < 350; i++) {
    const s = createdStudents[i % createdStudents.length];
    const card = studentCardMap.get(s._id.toString());
    const act = ACCESS_ACTIONS[i % ACCESS_ACTIONS.length];
    const hoursAgo = randInt(1, 720);
    const createdAt = new Date(now - hoursAgo * 3600 * 1000);

    accessDocs.push({
      card: card._id,
      owner: s._id,
      action: act.action,
      location: act.loc,
      detail: `Thao tác thực hiện bởi thẻ ${card.cardCode} (${s.fullName})`,
      createdBy: adminUser._id,
      createdAt,
      updatedAt: createdAt
    });
  }

  await AccessLog.insertMany(accessDocs);
  console.log(`[SEED] Created ${accessDocs.length} access logs.`);

  console.log('\n========================================================================');
  console.log('[SEED RICH COMPLETED SUCCESSFULLY]');
  console.log(`  - Students:             ${createdStudents.length}`);
  console.log(`  - Cards:                ${createdCards.length}`);
  console.log(`  - Wallets:              ${createdWallets.length}`);
  console.log(`  - Canteen Transactions: ${canteenTxDocs.length}`);
  console.log(`  - Library Loans:        ${loanDocs.length}`);
  console.log(`  - Room Bookings:        ${bookingDocs.length}`);
  console.log(`  - Events:               ${createdEvents.length}`);
  console.log(`  - Event Registrations:  ${regDocs.length}`);
  console.log(`  - Class Schedules:      ${scheduleDocs.length}`);
  console.log(`  - Parking Sessions:     ${parkingDocs.length}`);
  console.log(`  - Notifications:        ${notifDocs.length}`);
  console.log(`  - Access Logs:          ${accessDocs.length}`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedRich().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});

