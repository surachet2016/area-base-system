/**
 * คำนวณระยะห่างทางภูมิศาสตร์ด้วยสูตร Haversine Formula (หน่วย: เมตร)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // รัศมีเฉลี่ยของโลก (เมตร)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // ปัดเศษทศนิยม 1 ตำแหน่ง
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function isWithinGeofence(
  userLat: number,
  userLng: number,
  workLat: number,
  workLng: number,
  radiusMeters: number,
  accuracyMeters: number = 0
): { isInside: boolean; distanceMeters: number; totalAllowed: number } {
  const distanceMeters = calculateDistanceMeters(userLat, userLng, workLat, workLng);
  // อนุโลมค่าความคลาดเคลื่อนสัญญาณ GPS ภายในอาคาร (GPS Drift Tolerance สูงสุด 35 เมตร)
  const tolerance = Math.min(Math.max(0, accuracyMeters * 0.5), 35);
  const totalAllowed = radiusMeters + tolerance;

  return {
    isInside: distanceMeters <= totalAllowed,
    distanceMeters,
    totalAllowed,
  };
}
