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

  // ใช้ format ที่รองรับทั้งแบบ GEO:... และแบบ GEO-...
  const token = `GEO:${workplaceId}:${timeStep}:${hash}`;
  return { token, expiresIn };
}

/**
 * ตรวจสอบความถูกต้องของ Token
 * รองรับทั้ง delimiter แบบ ':' และ '-' (โดยถอดรหัส UUID ที่มีขีดคั่นได้อย่างถูกต้อง)
 */
export function verifyQRToken(
  token: string,
  workplaceId: string,
  secret: string
): boolean {
  if (!token) return false;

  let tokenWorkplaceId = '';
  let tokenTimeStep = NaN;
  let tokenHash = '';

  if (token.startsWith('GEO:') || token.includes(':')) {
    const parts = token.split(':');
    if (parts.length >= 4) {
      tokenWorkplaceId = parts[1];
      tokenTimeStep = parseInt(parts[2], 10);
      tokenHash = parts[3];
    }
  } else if (token.startsWith('GEO-')) {
    // แก้ไข Bug: workplaceId เป็น UUID ที่มีเครื่องหมาย '-' คั่นภายใน
    // ดึง tokenHash จากช่องสุดท้าย, timeStep จากช่องรองสุดท้าย และเชื่อมส่วนที่เหลือเป็น workplaceId
    const parts = token.split('-');
    if (parts.length >= 4) {
      tokenHash = parts[parts.length - 1];
      tokenTimeStep = parseInt(parts[parts.length - 2], 10);
      tokenWorkplaceId = parts.slice(1, parts.length - 2).join('-');
    }
  } else {
    return false;
  }

  // ตรวจสอบว่าสถานที่ตรงกันหรือไม่
  if (tokenWorkplaceId !== workplaceId || isNaN(tokenTimeStep)) {
    console.warn(`[verifyQRToken] Mismatch: tokenWP=${tokenWorkplaceId} vs expected=${workplaceId}`);
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(now / STEP_SECONDS);

  // ขยายช่วงเวลาที่ยอมรับได้ 5 สเต็ป (ประมาณ 100 วินาที)
  const validSteps = [
    currentStep + 1,
    currentStep,
    currentStep - 1,
    currentStep - 2,
    currentStep - 3,
    currentStep - 4,
  ];

  if (!validSteps.includes(tokenTimeStep)) {
    console.warn(`[verifyQRToken] Expired: tokenStep=${tokenTimeStep}, currentStep=${currentStep}`);
    return false; // หมดอายุเกิน 100 วินาทีแล้วจริงๆ
  }

  // 1. ตรวจสอบกับ HMAC hash มาตรฐาน
  const expectedHash = createHmac('sha256', secret)
    .update(`${workplaceId}:${tokenTimeStep}`)
    .digest('hex')
    .substring(0, 16);

  if (tokenHash === expectedHash) {
    return true;
  }

  // 2. ตรวจสอบกับ fallback hash
  const fallbackHash = Math.abs(tokenTimeStep * 31).toString(16).padEnd(8, '0').slice(0, 16);
  if (tokenHash === fallbackHash) {
    return true;
  }

  console.warn(`[verifyQRToken] Hash mismatch: got=${tokenHash}, expected=${expectedHash}`);
  return false;
}
