const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const QrCode = require('../models/QrCode');
const LibraryLoan = require('../models/LibraryLoan');
const RoomBooking = require('../models/RoomBooking');
const ClassSchedule = require('../models/ClassSchedule');
const Event = require('../models/Event');
const qrService = require('../services/qrService');

const OUTPUT_DIR = path.resolve(__dirname, '../../../qr-samples');
const PNG_DIR = path.join(OUTPUT_DIR, 'png');
const SVG_DIR = path.join(OUTPUT_DIR, 'svg');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateSampleKit() {
  console.log('--- SMARTPASS SAMPLE QR KIT GENERATOR ---');
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[ERROR] MONGO_URI is missing');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully');

  await ensureDir(OUTPUT_DIR);
  await ensureDir(PNG_DIR);
  await ensureDir(SVG_DIR);

  const missingEntities = [];

  // 1. CANTEEN_POINT
  const canteenSpecs = [
    {
      type: 'CANTEEN_POINT',
      refKind: 'counter',
      refId: 'CANTEEN-POS-01',
      label: 'Quầy Căng tin Số 1',
      location: 'Tầng 1 Nhà Căng tin',
      intendedLocation: 'Dán tại: Quầy thu ngân căng tin chính',
      expectedFlow: 'Sinh viên quét mã để mở giao diện tự nhập số tiền thanh toán từ ví cá nhân'
    }
  ];

  // 2. 10 x BOOK
  const targetBookCodes = [
    'BK-001', 'BK-002', 'BK-003', 'BK-004', 'BK-005',
    'BK-006', 'BK-007', 'BK-008', 'BK-009', 'BK-010'
  ];
  const bookSpecs = [];
  for (const bCode of targetBookCodes) {
    const loanDoc = await LibraryLoan.findOne({ bookCode: bCode });
    if (!loanDoc) {
      missingEntities.push(`Book: ${bCode}`);
    } else {
      bookSpecs.push({
        type: 'BOOK',
        refKind: 'book',
        refId: bCode,
        label: loanDoc.bookTitle,
        location: 'Khu vực Giá sách Thư viện Tầng 2',
        intendedLocation: `Dán tại: Bìa sau cuốn sách "${loanDoc.bookTitle}" (${bCode})`,
        expectedFlow: 'Sinh viên quét mã để mượn sách vào tài khoản (tối đa 3 cuốn đang mượn)'
      });
    }
  }

  // 3. PARKING_IN & PARKING_OUT
  const parkingSpecs = [
    {
      type: 'PARKING_IN',
      refKind: 'gate',
      refId: 'GATE-PARK-IN-01',
      label: 'Cổng gửi xe - Lối vào',
      location: 'Cổng Bãi giữ xe Trung tâm',
      intendedLocation: 'Dán tại: Cột barie lối vào bãi giữ xe máy',
      expectedFlow: 'Sinh viên quét mã để check-in gửi xe vào bãi'
    },
    {
      type: 'PARKING_OUT',
      refKind: 'gate',
      refId: 'GATE-PARK-OUT-01',
      label: 'Cổng gửi xe - Lối ra',
      location: 'Cổng Bãi giữ xe Trung tâm',
      intendedLocation: 'Dán tại: Cột barie lối ra bãi giữ xe máy',
      expectedFlow: 'Sinh viên quét mã để xem thời gian đỗ, tính phí 2.000 ₫/h và xác nhận ra'
    }
  ];

  // 4. 12 x ROOM
  const targetRoomNames = [
    'Phòng học nhóm A101',
    'Phòng học nhóm A102',
    'Phòng Lab Tin học B201',
    'Phòng Lab Tin học B202',
    'Hội trường Thư viện C301',
    'Phòng Nghiên cứu D101',
    'Lab 102',
    'Lab 201',
    'Lab 302',
    'Phòng 402',
    'Phòng 405',
    'Phòng 501'
  ];
  const roomSpecs = [];
  for (const rName of targetRoomNames) {
    const hasBooking = await RoomBooking.findOne({ room: rName });
    const hasSchedule = await ClassSchedule.findOne({ room: rName });
    if (!hasBooking && !hasSchedule) {
      missingEntities.push(`Room: ${rName}`);
    } else {
      roomSpecs.push({
        type: 'ROOM',
        refKind: 'room',
        refId: rName,
        label: rName,
        location: `Khuôn viên trường - ${rName}`,
        intendedLocation: `Dán tại: Cửa ra vào ${rName}`,
        expectedFlow: 'Sinh viên quét mã để xem thông tin phòng, lịch trống hôm nay và đặt phòng'
      });
    }
  }

  // 5. 3 x EVENT
  const upcomingEvents = await Event.find({ startAt: { $gte: new Date('2026-01-01') } })
    .sort({ startAt: 1 })
    .limit(3);
  if (upcomingEvents.length < 3) {
    missingEntities.push(`Not enough upcoming events (found ${upcomingEvents.length}/3)`);
  }
  const eventSpecs = upcomingEvents.map((ev, idx) => ({
    type: 'EVENT',
    refKind: 'event',
    refId: ev._id.toString(),
    label: ev.title,
    location: ev.location || 'Hội trường chính',
    intendedLocation: `Dán tại: Poster sự kiện "${ev.title}"`,
    expectedFlow: 'Sinh viên quét mã poster để xem thông tin chi tiết và đăng ký tham gia sự kiện'
  }));

  // 6. GATE_IN & GATE_OUT
  const gateSpecs = [
    {
      type: 'GATE_IN',
      refKind: 'gate',
      refId: 'CAMPUS-GATE-IN-01',
      label: 'Cổng chính - Lối vào',
      location: 'Cổng trường Đại học SmartPass',
      intendedLocation: 'Dán tại: Trụ turnstile kiểm soát lối vào cổng chính',
      expectedFlow: 'Sinh viên quét mã để ghi nhận vào trường (AccessLog action=entry)'
    },
    {
      type: 'GATE_OUT',
      refKind: 'gate',
      refId: 'CAMPUS-GATE-OUT-01',
      label: 'Cổng chính - Lối ra',
      location: 'Cổng trường Đại học SmartPass',
      intendedLocation: 'Dán tại: Trụ turnstile kiểm soát lối ra cổng chính',
      expectedFlow: 'Sinh viên quét mã để ghi nhận ra trường (AccessLog action=exit)'
    }
  ];

  // Check if missing entities exist
  if (missingEntities.length > 0) {
    console.error('CRITICAL: Cannot generate sample QR kit because the following entities are MISSING:');
    missingEntities.forEach((m) => console.error(`  - ${m}`));
    await mongoose.disconnect();
    process.exit(1);
  }

  const allSpecs = [
    ...canteenSpecs,
    ...bookSpecs,
    ...parkingSpecs,
    ...roomSpecs,
    ...eventSpecs,
    ...gateSpecs
  ];

  console.log(`Verified all ${allSpecs.length} target entities in MongoDB. Proceeding to generate QRs...`);

  const manifest = [];

  for (const spec of allSpecs) {
    // Upsert QrCode in database to guarantee idempotency across multiple runs
    let qrDoc = await QrCode.findOne({ type: spec.type, refId: spec.refId });
    if (!qrDoc) {
      const publicId = require('crypto').randomBytes(10).toString('hex');
      qrDoc = await QrCode.create({
        publicId,
        type: spec.type,
        refKind: spec.refKind,
        refId: spec.refId,
        label: spec.label,
        location: spec.location,
        isActive: true
      });
    } else {
      qrDoc.label = spec.label;
      qrDoc.location = spec.location;
      qrDoc.isActive = true;
      await qrDoc.save();
    }

    const canonicalPayload = qrService.buildCanonicalPayload(spec.type, qrDoc.publicId);
    const barePayload = qrService.buildBarePayload(spec.type, qrDoc.publicId);
    const humanCode = `${spec.type}-${qrDoc.publicId.slice(-6).toUpperCase()}`;

    const filenameSlug = `${spec.type.toLowerCase()}-${slugify(spec.refId)}`;
    const pngName = `${filenameSlug}.png`;
    const svgName = `${filenameSlug}.svg`;
    const pngPath = path.join(PNG_DIR, pngName);
    const svgPath = path.join(SVG_DIR, svgName);

    // Generate PNG: 1024px, ECC Q, quiet zone 4, #000000 on #FFFFFF
    await QRCode.toFile(pngPath, canonicalPayload, {
      errorCorrectionLevel: 'Q',
      margin: 4,
      width: 1024,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate SVG
    const svgContent = await QRCode.toString(canonicalPayload, {
      type: 'svg',
      errorCorrectionLevel: 'Q',
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    fs.writeFileSync(svgPath, svgContent, 'utf-8');

    manifest.push({
      type: spec.type,
      label: spec.label,
      refId: spec.refId,
      publicId: qrDoc.publicId,
      humanCode,
      canonicalPayload,
      barePayload,
      pngFile: `png/${pngName}`,
      svgFile: `svg/${svgName}`,
      intendedLocation: spec.intendedLocation,
      expectedFlow: spec.expectedFlow
    });

    console.log(`Generated [${spec.type}] ${spec.refId} -> ${humanCode} (${pngName})`);
  }

  // Write manifest.json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // Write manifest.csv
  const csvHeaders = 'type,label,refId,publicId,humanCode,pngFile,intendedLocation,expectedFlow\n';
  const csvRows = manifest
    .map(
      (m) =>
        `"${m.type}","${m.label.replace(/"/g, '""')}","${m.refId}","${m.publicId}","${m.humanCode}","${m.pngFile}","${m.intendedLocation.replace(/"/g, '""')}","${m.expectedFlow.replace(/"/g, '""')}"`
    )
    .join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.csv'), csvHeaders + csvRows, 'utf-8');

  // Generate printable print-sheet.html (A4 format, 4 cards per page, >= 50mm QR size)
  const printSheetHtml = generatePrintSheetHtml(manifest);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'print-sheet.html'), printSheetHtml, 'utf-8');

  // Generate README_QR_SAMPLES.md
  const readmeMd = generateReadmeMd(manifest);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README_QR_SAMPLES.md'), readmeMd, 'utf-8');

  console.log(`\nSUCCESS: Generated ${manifest.length} QR codes in ${OUTPUT_DIR}`);
  console.log('Manifests: manifest.json, manifest.csv');
  console.log('Printable: print-sheet.html');
  console.log('Documentation: README_QR_SAMPLES.md');

  await mongoose.disconnect();
}

function generatePrintSheetHtml(manifest) {
  // 4 cards per page
  const pages = [];
  for (let i = 0; i < manifest.length; i += 4) {
    pages.push(manifest.slice(i, i + 4));
  }

  const pagesHtml = pages
    .map(
      (pageCards, pageIdx) => `
    <div class="a4-page">
      <div class="page-header">
        <h2>BỘ MÃ QR DỊCH VỤ THỬ NGHIỆM SMARPASS - TRANG ${pageIdx + 1}/${pages.length}</h2>
        <p>In theo tỷ lệ 100% (Khổ A4 tiêu chuẩn, không co giãn trang). Mỗi ô cắt theo đường kẻ viền nét đứt.</p>
      </div>
      <div class="cards-grid">
        ${pageCards
          .map(
            (card) => `
          <div class="qr-card">
            <div class="badge-type">${card.type}</div>
            <div class="card-title">${card.label}</div>
            <div class="qr-img-wrapper">
              <img src="${card.pngFile}" alt="${card.humanCode}" class="qr-image" />
            </div>
            <div class="human-code-box">
              <span class="human-label">MÃ NHẬP TAY (HUMAN CODE):</span>
              <strong class="human-code">${card.humanCode}</strong>
            </div>
            <div class="card-location">${card.intendedLocation}</div>
            <div class="card-flow"><strong>Luồng:</strong> ${card.expectedFlow}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>SmartPass Printable QR Sample Kit</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      color: #111827;
    }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 12mm;
      margin: 10mm auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .page-header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 6mm;
      margin-bottom: 8mm;
    }
    .page-header h2 {
      margin: 0 0 2mm 0;
      color: #0f766e;
      font-size: 14pt;
      font-weight: 700;
    }
    .page-header p {
      margin: 0;
      font-size: 9pt;
      color: #4b5563;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8mm;
      flex: 1;
    }
    .qr-card {
      border: 1.5px dashed #9ca3af;
      border-radius: 8px;
      padding: 6mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: #fafafa;
    }
    .badge-type {
      background: #0f766e;
      color: white;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      margin-bottom: 2mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1f2937;
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2mm;
    }
    .qr-img-wrapper {
      background: white;
      padding: 4px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      margin-bottom: 2mm;
    }
    .qr-image {
      width: 58mm;
      height: 58mm;
      display: block;
    }
    .human-code-box {
      background: #e6fffa;
      border: 1px solid #99f6e4;
      border-radius: 4px;
      padding: 2mm 4mm;
      margin-bottom: 2mm;
      width: 100%;
    }
    .human-label {
      display: block;
      font-size: 7pt;
      color: #0f766e;
      font-weight: 600;
    }
    .human-code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 12pt;
      color: #0d9488;
      letter-spacing: 1px;
    }
    .card-location {
      font-size: 8pt;
      color: #4b5563;
      margin-bottom: 2mm;
      font-style: italic;
    }
    .card-flow {
      font-size: 7.5pt;
      color: #374151;
      text-align: left;
      width: 100%;
      border-top: 1px dotted #d1d5db;
      padding-top: 1.5mm;
    }
    @media print {
      body {
        background: none;
      }
      .a4-page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

function generateReadmeMd(manifest) {
  const typeCounts = manifest.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});

  const typeSummaryTable = Object.entries(typeCounts)
    .map(([type, count]) => `| \`${type}\` | ${count} mã |`)
    .join('\n');

  return `# SMARTPASS SAMPLE QR KIT

Bộ tài liệu mã QR dịch vụ in ấn thực tế được sinh từ cơ sở dữ liệu mẫu thật của SmartPass.

## 1. THỐNG KÊ DANH MỤC MÃ TRONG BỘ MẪU
Tổng số mã tĩnh đã tạo: **${manifest.length} mã**

| Loại mã | Số lượng tạo |
| :--- | :--- |
${typeSummaryTable}

## 2. HƯỚNG DẪN IN ẤN VÀ BỐ TRÍ VẬT LÝ
1. **Quy cách in:**
   - Mở file \`print-sheet.html\` bằng Google Chrome hoặc Safari.
   - Nhấn \`Ctrl + P\` (hoặc \`Cmd + P\`), chọn máy in hoặc "Save as PDF".
   - Khổ giấy: **A4**.
   - Tỷ lệ co giãn (Scale): Chọn **100% (Actual Size)**, tuyệt đối không chọn "Fit to Page" để đảm bảo kích thước mã QR in ra đạt chuẩn $\\ge 50\\text{ mm}$ (mỗi ô trong template có kích thước QR chính xác là $58\\text{ mm}$).
2. **Bố trí vị trí dán:**
   - Cắt theo đường viền nét đứt của từng ô.
   - Dán tại các vị trí thực tế trong khuôn viên trường học:
     - \`CANTEEN_POINT\`: Dán trên quầy thanh toán thu ngân căng tin.
     - \`BOOK\`: Dán trên bìa sau hoặc gáy 10 đầu sách thư viện (\`BK-001\` .. \`BK-010\`).
     - \`PARKING_IN\` / \`PARKING_OUT\`: Dán tại 2 cột trụ barie lối vào và lối ra của bãi giữ xe.
     - \`ROOM\`: Dán tại biển tên trước cửa 12 phòng học (\`A101\`, \`A102\`, \`B201\`, \`B202\`, \`C301\`, \`D101\`, \`Lab 102\`, v.v.).
     - \`EVENT\`: Dán trên các bảng tin hoặc poster sự kiện.
     - \`GATE_IN\` / \`GATE_OUT\`: Dán tại 2 trụ turnstile của cổng trường chính.

## 3. HƯỚNG DẪN THỰC HÀNH CÁC MÃ ĐỘNG (DYNAMIC QR)
Các loại mã động dưới đây KHÔNG in sẵn trên giấy vì có thời hạn hiệu lực ngắn để chống gian lận:
1. **Điểm danh buổi học (\`ATTENDANCE_SESSION\`, thời hạn 15 phút):**
   - Giảng viên/Nhân viên mở màn hình điểm danh trong app hoặc gọi API:
     \`POST /api/attendance/sessions/:classSession/qr\`
   - App sinh viên quét mã hiển thị trên màn hình giảng viên để ghi nhận điểm danh.
2. **Yêu cầu thanh toán Căng tin (\`PAYMENT_REQUEST\`, thời hạn 2 phút):**
   - Thu ngân căng tin nhập số tiền (ví dụ: 35.000 ₫) và gọi API:
     \`POST /api/wallet/payment-request\` với \`{ amount: 35000, counter: "Quầy 1" }\`
   - Mã động xuất hiện trên màn hình quầy. Sinh viên quét mã, app hiển thị số tiền 35.000 ₫ để bấm xác nhận thanh toán.

> [!WARNING]
> Toàn bộ các mã trong bộ mẫu này liên kết với dữ liệu thử nghiệm trong cơ sở dữ liệu MongoDB Atlas hiện tại. Khi triển khai trường học thực tế, quản trị viên sẽ tạo mã mới trên giao diện Admin Web.
`;
}

if (require.main === module) {
  generateSampleKit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal generator error:', err);
      process.exit(1);
    });
}

module.exports = { generateSampleKit };

