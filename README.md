# 🏢 Area-Based Mobile Time Attendance System
### ระบบบันทึกเวลาปฏิบัติงานของบุคลากรเชิงพื้นที่ผ่านสมาร์ตโฟน (Mobile PWA)

ระบบบันทึกเวลาทำงานด้วยการตรวจสอบ 2 ชั้น (**Two-Factor Location Verification**):
1. **Dynamic QR Code (Kiosk Display):** รหัส QR หมุนเวียนเปลี่ยนอัตโนมัติทุกๆ 20 วินาที ผ่าน HMAC-SHA256 Token ป้องกันการถ่ายรูปส่งต่อ
2. **Circle Geofencing (GPS Coordinates):** ตรวจจับพิกัดทางภูมิศาสตร์จริงและคำนวณระยะห่างด้วยสูตร **Haversine Formula** ว่าอยู่ภายในรัศมีที่กำหนดหรือไม่

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory)

```text
Aerea-Base-System/
├── frontend/                   # React 18 + Vite + Tailwind CSS + PWA Ready
│   ├── src/
│   │   ├── components/         # CheckInTab, KioskTab, HistoryTab, AdminMapTab
│   │   ├── utils/              # Haversine distance calculator
│   │   └── types.ts            # Type definitions
│   └── vite.config.ts          # Proxy ไปยัง Backend port 3001
├── backend/                    # Hono API (Node.js / Cloudflare Workers ready)
│   ├── src/
│   │   ├── services/           # Geofence Engine & QR TOTP Generator
│   │   ├── mockData.ts         # ข้อมูลตั้งต้นสำหรับรันและทดสอบทันที
│   │   └── index.ts            # REST API Endpoints
│   └── package.json
└── database/                   # SQL Scripts สำหรับ Supabase / PostgreSQL
    ├── 01_schema.sql           # โครงสร้างตารางและส่วนขยาย PostGIS
    └── 02_seed.sql             # ข้อมูลตัวอย่างสถานที่และบุคลากร
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Quick Start)

### 1. ติดตั้ง Dependencies และรัน Backend:
```bash
cd backend
npm install
npm run dev
# เซิร์ฟเวอร์ API จะเริ่มทำงานที่ http://localhost:3001
```

### 2. ติดตั้ง Dependencies และรัน Frontend:
```bash
cd frontend
npm install
npm run dev
# เปิดใช้งานเว็บแอปที่ http://localhost:5173
```

---

## 📱 โมดูลการใช้งาน

* **📍 บันทึกเวลา (Mobile View):** เรดาร์ตรวจจับ GPS, ปุ่มดึงพิกัดจริง, สแกน/กรอก Dynamic QR Token, บันทึกเข้างาน/ออกงาน
* **🖥️ โหมด Kiosk (Office Display):** จอ Fullscreen แสดง Dynamic QR Code ขนาดใหญ่ พร้อมเวลานับถอยหลัง 20 วินาที และนาฬิกาดิจิทัล
* **🕒 ประวัติส่วนตัว (Personal History):** ตรวจสอบประวัติส่วนตัวย้อนหลัง พร้อมสถานะ "ตรงเวลา / มาสาย"
* **📊 รายงานหลังบ้าน (Admin & HR Portal):** 
  * แดชบอร์ดสรุปสถิติ KPI (ยอดเข้างานวันนี้, ตรงเวลา %, มาสาย %, ระยะห่าง GPS เฉลี่ย)
  * ตัวกรองขั้นสูง (Filter ตามวันที่, อาคาร/สถานที่, สังกัด/ฝ่าย, สถานะเวลา และค้นหาชื่อ)
  * ตารางตรวจสอบ Audit Log พร้อมพิกัด GPS ละเอียด และปุ่มเปิดดูบน **Google Maps**
  * ปุ่มส่งออกรายงานเป็น **Excel / CSV** และปุ่มพิมพ์รายงาน
* **⚙️ จัดการพื้นที่ (Admin Geofence):** เพิ่ม/แก้ไขสถานที่ทำงาน กำหนดพิกัดละติจูด ลองจิจูด และรัศมีเมตร
