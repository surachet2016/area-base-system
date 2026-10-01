export interface Workplace {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  qrSecret: string;
  isActive: boolean;
}

export interface StaffProfile {
  id: string;
  staffCode: string;
  fullName: string;
  department: string;
  position: string;
  assignedWorkplaceId: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  department?: string;
  workplaceId: string;
  workplaceName: string;
  recordDate: string;
  recordType: 'CHECK_IN' | 'CHECK_OUT';
  recordedAt: string;
  userLat: number;
  userLng: number;
  distanceMeters: number;
  accuracyMeters?: number;
  status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'OVERTIME';
  deviceInfo?: string;
  remark?: string;
}

export const workplaces: Workplace[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    code: 'PKN-MAIN',
    name: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    latitude: 6.425556,
    longitude: 101.825278,
    radiusMeters: 80.0,
    qrSecret: 'pkn-secret-token-key-2026',
    isActive: true,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    code: 'TEST-OFFICE',
    name: 'สำนักงานประสานงานกรุงเทพฯ',
    latitude: 13.756331,
    longitude: 100.501765,
    radiusMeters: 100.0,
    qrSecret: 'test-secret-key-2026',
    isActive: true,
  },
];

export const staffProfiles: StaffProfile[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    staffCode: 'ST-67001',
    fullName: 'ดร.สุรเชษฐ์ สังขพันธ์',
    department: 'บัณฑิตวิทยาลัย',
    position: 'อาจารย์ประจำหลักสูตร',
    assignedWorkplaceId: 'a0000000-0000-0000-0000-000000000001',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    staffCode: 'ST-67002',
    fullName: 'สมชาย ใจมั่นคง',
    department: 'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ',
    position: 'นักวิชาการคอมพิวเตอร์',
    assignedWorkplaceId: 'a0000000-0000-0000-0000-000000000001',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    staffCode: 'ST-67003',
    fullName: 'อัสมา ยะโก๊ะ',
    department: 'คณะวิทยาการจัดการ',
    position: 'เจ้าหน้าที่บริหารงานทั่วไป',
    assignedWorkplaceId: 'a0000000-0000-0000-0000-000000000001',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    staffCode: 'ST-67004',
    fullName: 'ฟาฮัด มะแซ',
    department: 'กองนโยบายและแผน',
    position: 'นักวิเคราะห์นโยบายและแผน',
    assignedWorkplaceId: 'a0000000-0000-0000-0000-000000000001',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    staffCode: 'ST-67005',
    fullName: 'ปิยะนุช สุวรรณโณ',
    department: 'สำนักงานอธิการบดี',
    position: 'นิติกร',
    assignedWorkplaceId: 'a0000000-0000-0000-0000-000000000001',
  },
];

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'rec-001',
    staffId: 'b0000000-0000-0000-0000-000000000001',
    staffName: 'ดร.สุรเชษฐ์ สังขพันธ์',
    department: 'บัณฑิตวิทยาลัย',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-10-01',
    recordType: 'CHECK_IN',
    recordedAt: '2026-10-01T08:24:12+07:00',
    userLat: 6.425580,
    userLng: 101.825250,
    distanceMeters: 4.2,
    accuracyMeters: 5.0,
    status: 'ON_TIME',
    remark: 'ตรงเวลา (GPS แม่นยำ)',
  },
  {
    id: 'rec-002',
    staffId: 'b0000000-0000-0000-0000-000000000002',
    staffName: 'สมชาย ใจมั่นคง',
    department: 'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-10-01',
    recordType: 'CHECK_IN',
    recordedAt: '2026-10-01T08:28:45+07:00',
    userLat: 6.425540,
    userLng: 101.825290,
    distanceMeters: 8.5,
    accuracyMeters: 7.2,
    status: 'ON_TIME',
    remark: 'ตรงเวลา',
  },
  {
    id: 'rec-003',
    staffId: 'b0000000-0000-0000-0000-000000000003',
    staffName: 'อัสมา ยะโก๊ะ',
    department: 'คณะวิทยาการจัดการ',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-10-01',
    recordType: 'CHECK_IN',
    recordedAt: '2026-10-01T08:52:10+07:00',
    userLat: 6.425570,
    userLng: 101.825260,
    distanceMeters: 12.1,
    accuracyMeters: 6.0,
    status: 'LATE',
    remark: 'มาสาย 7 นาที',
  },
  {
    id: 'rec-004',
    staffId: 'b0000000-0000-0000-0000-000000000004',
    staffName: 'ฟาฮัด มะแซ',
    department: 'กองนโยบายและแผน',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-10-01',
    recordType: 'CHECK_IN',
    recordedAt: '2026-10-01T08:15:30+07:00',
    userLat: 6.425560,
    userLng: 101.825270,
    distanceMeters: 3.1,
    accuracyMeters: 4.5,
    status: 'ON_TIME',
    remark: 'ตรงเวลา',
  },
  {
    id: 'rec-005',
    staffId: 'b0000000-0000-0000-0000-000000000005',
    staffName: 'ปิยะนุช สุวรรณโณ',
    department: 'สำนักงานอธิการบดี',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-10-01',
    recordType: 'CHECK_IN',
    recordedAt: '2026-10-01T08:58:19+07:00',
    userLat: 6.425590,
    userLng: 101.825240,
    distanceMeters: 14.8,
    accuracyMeters: 8.0,
    status: 'LATE',
    remark: 'มาสาย 13 นาที',
  },
  {
    id: 'rec-006',
    staffId: 'b0000000-0000-0000-0000-000000000001',
    staffName: 'ดร.สุรเชษฐ์ สังขพันธ์',
    department: 'บัณฑิตวิทยาลัย',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-09-30',
    recordType: 'CHECK_IN',
    recordedAt: '2026-09-30T08:20:00+07:00',
    userLat: 6.425550,
    userLng: 101.825280,
    distanceMeters: 5.5,
    accuracyMeters: 5.5,
    status: 'ON_TIME',
    remark: 'ตรงเวลา',
  },
  {
    id: 'rec-007',
    staffId: 'b0000000-0000-0000-0000-000000000001',
    staffName: 'ดร.สุรเชษฐ์ สังขพันธ์',
    department: 'บัณฑิตวิทยาลัย',
    workplaceId: 'a0000000-0000-0000-0000-000000000001',
    workplaceName: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    recordDate: '2026-09-30',
    recordType: 'CHECK_OUT',
    recordedAt: '2026-09-30T16:35:10+07:00',
    userLat: 6.425555,
    userLng: 101.825275,
    distanceMeters: 3.8,
    accuracyMeters: 6.0,
    status: 'ON_TIME',
    remark: 'ลงเวลาออกงานปกติ',
  },
];
