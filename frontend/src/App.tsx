import { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { CheckInTab } from './components/CheckInTab';
import { HistoryTab } from './components/HistoryTab';
import { KioskTab } from './components/KioskTab';
import { AdminReportTab } from './components/AdminReportTab';
import { AdminMapTab } from './components/AdminMapTab';
import { Workplace, AttendanceRecord } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports'); // ค่าเริ่มต้นเปิดหน้า Reports เพื่อให้เห็นหลังบ้านทันที หรือ Checkin
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // โหลดรายการสถานที่และประวัติเริ่มต้น
  const fetchData = async () => {
    try {
      const [wpRes, recRes] = await Promise.all([
        fetch('/api/workplaces'),
        fetch('/api/attendance/history'),
      ]);
      const wpData = await wpRes.json();
      const recData = await recRes.json();

      if (wpData.success) setWorkplaces(wpData.data);
      if (recData.success) setRecords(recData.data);
    } catch {
      console.warn('Backend not reached yet, using default initial data');
      setWorkplaces([
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
          id: 'a0000000-0000-0000-0000-000000000003',
          code: 'HOME-SURACHET',
          name: 'บ้านพักอาจารย์ (จุดทดสอบ WFH)',
          latitude: 6.44592,
          longitude: 101.806549,
          radiusMeters: 80.0,
          qrSecret: 'home-secret-token-key-2026',
          isActive: true,
        },
      ]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckInSuccess = (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleAddWorkplace = (newWp: Workplace) => {
    setWorkplaces((prev) => [...prev, newWp]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeTab === 'checkin' && (
          <CheckInTab
            workplaces={workplaces}
            onCheckInSuccess={handleCheckInSuccess}
          />
        )}

        {activeTab === 'history' && <HistoryTab records={records} />}

        {activeTab === 'kiosk' && <KioskTab workplaces={workplaces} />}

        {activeTab === 'reports' && <AdminReportTab workplaces={workplaces} />}

        {activeTab === 'admin' && (
          <AdminMapTab
            workplaces={workplaces}
            onAddWorkplace={handleAddWorkplace}
          />
        )}
      </main>
    </div>
  );
}

export default App;
