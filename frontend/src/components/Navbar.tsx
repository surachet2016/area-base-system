import React from 'react';
import { ShieldCheck, History, Monitor, BarChart3, MapPin, Building2 } from 'lucide-react';

export type ActiveTab = 'checkin' | 'history' | 'kiosk' | 'reports' | 'admin';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-800 leading-tight">Area Attendance</h1>
              <p className="text-[10px] text-slate-500">ระบบลงเวลาเชิงพื้นที่ & สารสนเทศหลังบ้าน</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'checkin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              บันทึกเวลา
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประวัติส่วนตัว
            </button>
            <button
              onClick={() => setActiveTab('kiosk')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'kiosk' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              จอ Kiosk
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              รายงานหลังบ้าน (Admin)
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              จัดการพื้นที่
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'checkin' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">ลงเวลา</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">ประวัติ</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'kiosk' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Monitor className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">Kiosk</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'reports' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">รายงาน</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'admin' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">พื้นที่</span>
          </button>
        </div>
      </nav>
    </>
  );
};
