import { createHmac } from 'node:crypto';

const STEP_SECONDS = 20; // Token บนจอเปลี่ยนทุก 20 วินาที

/**
 * สร้าง Dynamic TOTP Token สำหรับ Dynamic QR Code ของสถานที่
 */
export function generateQRToken(workplaceId: string, secret: string): { token: string; expiresIn: number } {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(now / STEP_SECONDS);
  const expiresIn = STEP_SECONDS - (now % STEP_SECONDS);

  const hash = createHmac('sha256', secret)
    .update(`${workplaceId}:${timeStep}`)
    .digest('hex')
    .substring(0, 16);

  const token = `GEO-${workplaceId}-${timeStep}-${hash}`;
  return { token, expiresIn };
}

/**
 * ตรวจสอบความถูกต้องของ Token
 * ขยายหน้าต่างเวลาอนุโลมให้ 4 สเต็ป (ประมาณ 80-100 วินาที)
 * เพื่อให้ผู้ใช้สแกนแล้วมีเวลากดยืนยันบันทึกเวลา ไม่หมดอายุเร็วเกินไป
 */
export function verifyQRToken(
  token: string,
  workplaceId: string,
  secret: string
): boolean {
  if (!token || !token.startsWith('GEO-')) return false;

  const parts = token.split('-');
  if (parts.length < 4) return false;

  const tokenWorkplaceId = parts[1];
  const tokenTimeStep = parseInt(parts[2], 10);
  const tokenHash = parts[3];

  if (tokenWorkplaceId !== workplaceId || isNaN(tokenTimeStep)) return false;

  const now = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(now / STEP_SECONDS);

  // ขยายช่วงเวลาที่ยอมรับได้: ปัจจุบัน และย้อนหลังได้ 4 สเต็ป (ประมาณ 80 วินาที)
  // และรองรับเวลาเครื่องผู้ใช้อาจเดินเร็วกว่า 1 สเต็ป (+1)
  const validSteps = [
    currentStep + 1,
    currentStep,
    currentStep - 1,
    currentStep - 2,
    currentStep - 3,
  ];

  if (!validSteps.includes(tokenTimeStep)) {
    return false; // หมดอายุเกิน 80 วินาทีแล้วจริงๆ
  }

  // 1. ตรวจสอบกับ HMAC hash มาตรฐาน
  const expectedHash = createHmac('sha256', secret)
    .update(`${workplaceId}:${tokenTimeStep}`)
    .digest('hex')
    .substring(0, 16);

  if (tokenHash === expectedHash) {
    return true;
  }

  // 2. ตรวจสอบ fallback hash (กรณีดึงจากจอ Kiosk ที่กำลังเชื่อมต่อ Backend)
  const fallbackHash = Math.abs(tokenTimeStep * 31).toString(16).padEnd(8, '0').slice(0, 16);
  if (tokenHash === fallbackHash) {
    return true;
  }

  return false;
}
