-- ==============================================================
-- 01_SCHEMA.SQL: ระบบบันทึกเวลาทำงานเชิงพื้นที่ (Area-Based Time Attendance)
-- ==============================================================

-- 1. เปิดส่วนขยาย PostGIS (กรณีรันบน Supabase หรือ PostgreSQL ที่รองรับ)
create extension if not exists postgis;

-- 2. ตารางสถานที่ปฏิบัติงานและรัศมี Geofence
create table if not exists workplaces (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                  -- เช่น 'HQ-MAIN', 'CAMPUS-A'
  name text not null,                          -- เช่น 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์'
  latitude double precision not null,          -- พิกัดละติจูด (Lat)
  longitude double precision not null,         -- พิกัดลองจิจูด (Lng)
  radius_meters double precision default 50.0, -- รัศมีที่อนุญาตให้ลงเวลา (เช่น 50 เมตร)
  qr_secret text not null default 'secret-key-area-base-2026', -- Secret Key สำหรับสร้าง Dynamic QR
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. ตารางข้อมูลบุคลากร (Staff Profile)
create table if not exists staff_profiles (
  id uuid primary key default gen_random_uuid(),
  staff_code text unique not null,             -- รหัสประจำตัว เช่น 'ST-670101'
  full_name text not null,                     -- ชื่อ-นามสกุล
  department text not null,                    -- ฝ่าย / คณะ / สำนัก
  position text,                               -- ตำแหน่ง
  assigned_workplace_id uuid references workplaces(id),
  created_at timestamptz default now()
);

-- 4. ตารางกะเวลาทำงาน (Work Shifts)
create table if not exists work_shifts (
  id serial primary key,
  shift_name text not null,                    -- เช่น 'กะปกติ (08:30 - 16:30)'
  start_time time not null,                    -- 08:30:00
  late_threshold_time time not null,           -- 08:45:00 (เกินเวลานี้ถือว่ามาสาย)
  end_time time not null                       -- 16:30:00
);

-- 5. ตารางประวัติบันทึกเวลาเข้า-ออกงาน (Attendance Records)
create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff_profiles(id) not null,
  workplace_id uuid references workplaces(id) not null,
  record_date date default current_date not null,
  record_type text check (record_type in ('CHECK_IN', 'CHECK_OUT')) not null,
  recorded_at timestamptz default now() not null,
  user_lat double precision not null,
  user_lng double precision not null,
  distance_meters double precision not null,   -- ระยะห่างจริง ณ จุดสแกน (เมตร)
  accuracy_meters double precision,            -- ความคลาดเคลื่อนของ GPS
  status text check (status in ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'OVERTIME')) not null,
  device_info jsonb,
  remark text
);

-- ดัชนีเพื่อการค้นหาประวัติที่รวดเร็ว
create index if not exists idx_attendance_staff_date on attendance_records (staff_id, record_date);
create index if not exists idx_attendance_workplace on attendance_records (workplace_id);
