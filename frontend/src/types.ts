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

export interface QRTokenResponse {
  workplaceId: string;
  workplaceName: string;
  token: string;
  expiresIn: number;
}
