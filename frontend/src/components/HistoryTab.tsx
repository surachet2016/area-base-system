import React from 'react';
import { History, CheckCircle, Clock, MapPin, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface Props {
  records: AttendanceRecord[];
}

export const HistoryTab: React.FC<Props> = ({ records }) => {
  const exportToCSV = () => {
    if (records.length === 0) {
      alert('ยังไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    const headers = ['ลำดับ', 'ชื่อ-สกุล', 'สถานที่', 'วันที่', 'เวลา', 'ประเภท', 'สถานะ', 'ระยะห่าง(เมตร)', 'Lat', 'Lng'];
    const rows = records.map((r, i) => [
      i + 1,
      r.staffName,
      `"${r.workplaceName}"`,
      r.recordDate,
      new Date(r.recordedAt).toLocaleTimeString('th-TH'),
      r.recordType === 'CHECK_IN' ? 'เข้างาน' : 'ออกงาน',
      r.status === 'LATE' ? 'สาย' : 'ตรงเวลา',
      r.distanceMeters,
      r.userLat,
      r.userLng,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">ประวัติการบันทึกเวลาทำงาน</h3>
            <p className="text-xs text-slate-500">รวมทั้งหมด {records.length} รายการ</p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="space-y-3">
        {records.map((rec) => {
          const isLate = rec.status === 'LATE';
          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{rec.staffName}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {rec.workplaceName}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isLate
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isLate ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {isLate ? 'มาสาย' : 'ตรงเวลา'}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {rec.recordType === 'CHECK_IN' ? 'เข้างาน (Check-In)' : 'ออกงาน (Check-Out)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(rec.recordedAt).toLocaleString('th-TH')}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  ระยะห่าง: <strong className="text-slate-800">{rec.distanceMeters} ม.</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
