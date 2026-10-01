import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { isWithinGeofence } from './services/geofence.js';
import { generateQRToken, verifyQRToken } from './services/qr.js';
import {
  workplaces,
  staffProfiles,
  attendanceRecords,
  type Workplace,
  type AttendanceRecord,
} from './mockData.js';

const app = new Hono();

// Enable CORS for frontend PWA
app.use('*', cors());

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Area-Based Attendance Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// 1. ดึงรายการสถานที่ทั้งหมด (Workplaces)
app.get('/api/workplaces', (c) => {
  return c.json({ success: true, data: workplaces });
});

// 2. เพิ่ม/อัปเดตสถานที่ทำงานและพิกัด Geofence
app.post('/api/workplaces', async (c) => {
  const body = await c.req.json();
  const newWorkplace: Workplace = {
    id: body.id || `wp-${Date.now()}`,
    code: body.code || `LOC-${Math.floor(Math.random() * 900 + 100)}`,
    name: body.name,
    latitude: parseFloat(body.latitude),
    longitude: parseFloat(body.longitude),
    radiusMeters: parseFloat(body.radiusMeters) || 50.0,
    qrSecret: body.qrSecret || 'secret-' + Math.random().toString(36).substring(7),
    isActive: true,
  };
  workplaces.push(newWorkplace);
  return c.json({ success: true, data: newWorkplace });
});

// 3. จอ Kiosk ดึง Dynamic QR Code Token (หมุนเวียนทุก 20 วินาที)
app.get('/api/kiosk/token/:workplaceId', (c) => {
  const workplaceId = c.req.param('workplaceId');
  const workplace = workplaces.find((w) => w.id === workplaceId);

  if (!workplace) {
    return c.json({ success: false, message: 'ไม่พบสถานที่ที่ระบุ' }, 404);
  }

  const { token, expiresIn } = generateQRToken(workplace.id, workplace.qrSecret);
  return c.json({
    success: true,
    data: {
      workplaceId: workplace.id,
      workplaceName: workplace.name,
      token,
      expiresIn,
    },
  });
});

// 4. บันทึกเวลาเข้า-ออกงาน (Check-in / Check-out with Two-Factor Verification)
app.post('/api/attendance/check-in', async (c) => {
  const body = await c.req.json();
  const { staffId, workplaceId, token, userLat, userLng, accuracyMeters, recordType } = body;

  const staff = staffProfiles.find((s) => s.id === staffId) || staffProfiles[0];
  const workplace = workplaces.find((w) => w.id === workplaceId);

  if (!workplace) {
    return c.json({ success: false, message: 'ไม่พบสถานที่ทำงานนี้ในระบบ' }, 400);
  }

  // Factor 1: ตรวจสอบ Dynamic QR Token
  const isQRValid = verifyQRToken(token, workplace.id, workplace.qrSecret);
  if (!isQRValid) {
    return c.json(
      {
        success: false,
        error: 'INVALID_OR_EXPIRED_QR',
        message: 'รหัส QR Code หมดอายุหรือไม่ถูกต้อง กรุณาสแกนจากหน้าจอใหม่อีกครั้ง',
      },
      400
    );
  }

  // Factor 2: ตรวจสอบ Geofence พิกัดจริง (รวม GPS Drift Tolerance ในอาคาร)
  const accuracy = parseFloat(accuracyMeters) || 0;
  const { isInside, distanceMeters, totalAllowed } = isWithinGeofence(
    parseFloat(userLat),
    parseFloat(userLng),
    workplace.latitude,
    workplace.longitude,
    workplace.radiusMeters,
    accuracy
  );

  if (!isInside) {
    return c.json(
      {
        success: false,
        error: 'OUT_OF_GEOFENCE',
        message: `ท่านอยู่นอกพื้นที่ที่กำหนด (ห่างจากจุดเช็กอิน ${distanceMeters} เมตร, อนุญาตไม่เกิน ${Math.round(totalAllowed)} เมตร)`,
        data: { distanceMeters, allowedRadius: workplace.radiusMeters, totalAllowed },
      },
      403
    );
  }

  const isCheckIn = (recordType || 'CHECK_IN') === 'CHECK_IN';

  // คำนวณสถานะเวลา
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  let status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'OVERTIME' = 'ON_TIME';
  if (isCheckIn) {
    status = hours > 8 || (hours === 8 && minutes > 45) ? 'LATE' : 'ON_TIME';
  } else {
    // กรณีออกงาน (เช็กว่าออกก่อน 16:30 หรือทำ OT หลัง 17:00 หรือไม่)
    if (hours < 16 || (hours === 16 && minutes < 30)) {
      status = 'EARLY_LEAVE';
    } else if (hours >= 17) {
      status = 'OVERTIME';
    } else {
      status = 'ON_TIME';
    }
  }

  const successMessage = isCheckIn
    ? 'บันทึกเวลาเข้างานเรียบร้อยแล้ว ✅'
    : 'บันทึกเวลาออกจากงานเรียบร้อยแล้ว ✅ (ขอให้เดินทางกลับโดยสวัสดิภาพ)';

  const remarkText = isCheckIn
    ? `เข้างานสำเร็จ (${status === 'LATE' ? 'มาสาย' : 'ตรงเวลา'}, ห่างจุดกึ่งกลาง ${distanceMeters} ม.)`
    : `ออกจากงานสำเร็จ (${status === 'EARLY_LEAVE' ? 'ออกก่อนเวลา' : 'เลิกงานปกติ'}, ห่างจุดกึ่งกลาง ${distanceMeters} ม.)`;

  const newRecord: AttendanceRecord = {
    id: `rec-${Date.now()}`,
    staffId: staff.id,
    staffName: staff.fullName,
    department: staff.department,
    workplaceId: workplace.id,
    workplaceName: workplace.name,
    recordDate: now.toISOString().split('T')[0],
    recordType: recordType || 'CHECK_IN',
    recordedAt: now.toISOString(),
    userLat: parseFloat(userLat),
    userLng: parseFloat(userLng),
    distanceMeters,
    accuracyMeters: accuracy,
    status,
    remark: remarkText,
  };

  attendanceRecords.unshift(newRecord);

  return c.json({
    success: true,
    message: successMessage,
    data: newRecord,
  });
});

// 5. ดึงประวัติการลงเวลาทั่วไป
app.get('/api/attendance/history', (c) => {
  return c.json({ success: true, data: attendanceRecords });
});

// ==========================================
// 6. ระบบรายงานหลังบ้านสำหรับ Admin / HR
// ==========================================

// 6.1 รายชื่อบุคลากรทั้งหมด
app.get('/api/admin/staff', (c) => {
  return c.json({ success: true, data: staffProfiles });
});

// 6.2 ดึงรายงานการเข้าทำงานพร้อมตัวกรอง (Filters: date, workplace, status, search)
app.get('/api/admin/reports', (c) => {
  const { date, startDate, endDate, workplaceId, status, search, department } = c.req.query();

  let filtered = [...attendanceRecords];

  if (date) {
    filtered = filtered.filter((r) => r.recordDate === date);
  }
  if (startDate) {
    filtered = filtered.filter((r) => r.recordDate >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((r) => r.recordDate <= endDate);
  }
  if (workplaceId && workplaceId !== 'ALL') {
    filtered = filtered.filter((r) => r.workplaceId === workplaceId);
  }
  if (status && status !== 'ALL') {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (department && department !== 'ALL') {
    filtered = filtered.filter((r) => r.department === department);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.staffName.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        r.workplaceName.toLowerCase().includes(q)
    );
  }

  return c.json({
    success: true,
    total: filtered.length,
    data: filtered,
  });
});

// 6.3 สถิติสรุป KPI ภาพรวม (Admin Dashboard Overview)
app.get('/api/admin/stats', (c) => {
  const todayStr = '2026-10-01'; // วันที่ปัจจุบันของระบบ
  const todayRecords = attendanceRecords.filter(
    (r) => r.recordDate === todayStr && r.recordType === 'CHECK_IN'
  );

  const totalStaff = staffProfiles.length;
  const totalCheckedInToday = todayRecords.length;
  const onTimeCount = todayRecords.filter((r) => r.status === 'ON_TIME').length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const pendingCount = Math.max(0, totalStaff - totalCheckedInToday);

  // คำนวณระยะห่าง GPS เฉลี่ย
  const avgDistance =
    todayRecords.length > 0
      ? Math.round(
          (todayRecords.reduce((sum, r) => sum + r.distanceMeters, 0) /
            todayRecords.length) *
            10
        ) / 10
      : 0;

  return c.json({
    success: true,
    data: {
      today: todayStr,
      totalStaff,
      totalCheckedInToday,
      onTimeCount,
      lateCount,
      pendingCount,
      onTimeRate:
        totalCheckedInToday > 0
          ? Math.round((onTimeCount / totalCheckedInToday) * 100)
          : 0,
      lateRate:
        totalCheckedInToday > 0
          ? Math.round((lateCount / totalCheckedInToday) * 100)
          : 0,
      avgDistance,
    },
  });
});

// Start Server
const port = 3001;
console.log(`🚀 Area-Based Backend Server is running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});
