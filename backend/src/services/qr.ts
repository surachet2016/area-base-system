import { createHmac } from 'node:crypto';

const STEP_SECONDS = 20; // Token เปลี่ยนทุก 20 วินาที

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
    .substring(0, 16); // ใช้ 16 หลักเพื่อความกะทัดรัด

  const token = `GEO-${workplaceId}-${timeStep}-${hash}`;
  return { token, expiresIn };
}

/**
 * ตรวจสอบความถูกต้องของ Token (อนุญาตให้เหลื่อมเวลาได้ 1 step ป้องกันเน็ตช้า)
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

  // ตรวจสอบทั้งเวลาปัจจุบัน และเวลาย้อนหลัง 1 สเต็ป (ไม่เกิน 20 วินาทีก่อนหน้า)
  const validSteps = [currentStep, currentStep - 1];

  if (!validSteps.includes(tokenTimeStep)) {
    return false; // หมดอายุแล้ว
  }

  const expectedHash = createHmac('sha256', secret)
    .update(`${workplaceId}:${tokenTimeStep}`)
    .digest('hex')
    .substring(0, 16);

  return tokenHash === expectedHash;
}
