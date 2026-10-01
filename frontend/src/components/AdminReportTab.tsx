import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Search,
  Filter,
  FileSpreadsheet,
  ExternalLink,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Workplace, AttendanceRecord } from '../types';

interface AdminStats {
  today: string;
  totalStaff: number;
  totalCheckedInToday: number;
  onTimeCount: number;
  lateCount: number;
  pendingCount: number;
  onTimeRate: number;
  lateRate: number;
  avgDistance: number;
}

interface Props {
  workplaces: Workplace[];
}

export const AdminReportTab: React.FC<Props> = ({ workplaces }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // ตัวกรอง (Filter States)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-01');
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // โหลดสถิติ KPI
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  // โหลดรายงานการเข้าทำงานพร้อมตัวกรอง
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedWorkplace !== 'ALL') params.append('workplaceId', selectedWorkplace);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedDept !== 'ALL') params.append('department', selectedDept);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch reports', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedDate, selectedWorkplace, selectedStatus, selectedDept, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (reports.length === 0) {
      alert('ไม่มีข้อมูลในรายงานสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'รหัส/ชื่อบุคลากร',
      'หน่วยงาน/สังกัด',
      'สถานที่ปฏิบัติงาน',
      'วันที่',
      'เวลาบันทึก',
      'ประเภท',
      'สถานะ',
      'ระยะห่างจากศูนย์กลาง(เมตร)',
      'GPS Lat',
      'GPS Lng',
      'ความแม่นยำ GPS(เมตร)',
    ];

    const rows = reports.map((r, i) => [
      i + 1,
      `"${r.staffName}"`,
      `"${r.department || '-'}"`,
      `"${r.workplaceName}"`,
      r.recordDate,
      new Date(r.recordedAt).toLocaleTimeString('th-TH'),
      r.recordType === 'CHECK_IN' ? 'เข้างาน' : 'ออกงาน',
      r.status === 'LATE' ? 'มาสาย' : 'ตรงเวลา',
      r.distanceMeters,
      r.userLat,
      r.userLng,
      r.accuracyMeters || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Admin_Attendance_Report_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. ส่วนหัวของระบบหลังบ้าน */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400">ระบบรายงานสารสนเทศหลังบ้าน</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 mt-1">รายงานการเข้าปฏิบัติงานของบุคลากร</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจสอบข้อมูลเวลา พิกัด GPS ความคลาดเคลื่อน และหลักฐานการลงชื่อรายบุคคล
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ส่งออก Excel/CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* 2. การ์ดสถิติสรุป KPI (Analytics Overview Cards) */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">บุคลากรทั้งหมด</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-800">{stats.totalStaff}</div>
            <p className="text-[11px] text-slate-400 mt-1">ในระบบฐานข้อมูล</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-medium">ลงเวลาเข้างานแล้ว</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.totalCheckedInToday}</div>
            <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">
              คิดเป็น {stats.totalStaff > 0 ? Math.round((stats.totalCheckedInToday / stats.totalStaff) * 100) : 0}% ของทั้งหมด
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <span className="text-xs font-medium">มาตรงเวลา</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600">{stats.onTimeCount}</div>
            <p className="text-[11px] text-blue-700/80 mt-1 font-medium">{stats.onTimeRate}% ของผู้ลงเวลา</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-medium">มาสาย (เกิน 08:45)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.lateCount}</div>
            <p className="text-[11px] text-amber-700/80 mt-1 font-medium">{stats.lateRate}% ของผู้ลงเวลา</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-medium">ระยะห่างเฉลี่ย GPS</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600">{stats.avgDistance} ม.</div>
            <p className="text-[11px] text-slate-400 mt-1">ความแม่นยำในขอบเขต</p>
          </div>
        </div>
      )}

      {/* 3. แถบตัวกรองรายงาน (Advanced Filters) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            ตัวกรองและค้นหารายงาน
          </span>
          <span className="text-xs text-slate-500">
            พบข้อมูล <strong className="text-blue-600">{reports.length}</strong> รายการ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* วันที่ */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> ประจำวันที่
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* สถานที่ */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> สถานที่ปฏิบัติงาน
            </label>
            <select
              value={selectedWorkplace}
              onChange={(e) => setSelectedWorkplace(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกสถานที่</option>
              {workplaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* สังกัด/ฝ่าย */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">สังกัด / คณะ / ฝ่าย</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกสังกัด</option>
              <option value="บัณฑิตวิทยาลัย">บัณฑิตวิทยาลัย</option>
              <option value="สำนักวิทยบริการและเทคโนโลยีสารสนเทศ">สำนักวิทยบริการฯ</option>
              <option value="คณะวิทยาการจัดการ">คณะวิทยาการจัดการ</option>
              <option value="กองนโยบายและแผน">กองนโยบายและแผน</option>
              <option value="สำนักงานอธิการบดี">สำนักงานอธิการบดี</option>
            </select>
          </div>

          {/* สถานะ */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">สถานะเวลา</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ON_TIME">ตรงเวลา</option>
              <option value="LATE">มาสาย</option>
              <option value="EARLY_LEAVE">ออกก่อนเวลา</option>
            </select>
          </div>

          {/* ช่องค้นหา */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1">
              <Search className="w-3 h-3" /> ค้นหาชื่อบุคลากร
            </label>
            <input
              type="text"
              placeholder="พิมพ์ชื่อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. ตารางรายงานรายละเอียด (Detailed Audit Log Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">ลำดับ</th>
                <th className="py-3 px-4">บุคลากร / ตำแหน่ง</th>
                <th className="py-3 px-4">สังกัด / ฝ่าย</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">เวลาลงชื่อ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ระยะห่าง Geofence</th>
                <th className="py-3 px-4">พิกัด GPS จริง</th>
                <th className="py-3 px-4 text-center">แผนที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลรายงาน...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลการลงเวลาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                reports.map((rec, index) => {
                  const isLate = rec.status === 'LATE';
                  const gmapUrl = `https://www.google.com/maps?q=${rec.userLat},${rec.userLng}`;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{rec.staffName}</div>
                        <div className="text-[10px] text-slate-400">{rec.workplaceName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{rec.department || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec.recordType === 'CHECK_IN'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {rec.recordType === 'CHECK_IN' ? 'เข้างาน' : 'ออกงาน'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {new Date(rec.recordedAt).toLocaleTimeString('th-TH')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isLate
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLate ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {isLate ? 'มาสาย' : 'ตรงเวลา'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{rec.distanceMeters}</span> ม.
                        {rec.accuracyMeters && (
                          <span className="text-[10px] text-slate-400 block">
                            (±{rec.accuracyMeters} ม.)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {rec.userLat.toFixed(5)}, {rec.userLng.toFixed(5)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={gmapUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="เปิดดูตำแหน่งจริงบน Google Maps"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
