import React, { useState } from 'react';
import { Building2, Plus, MapPin, Radio, Shield, LocateFixed, Check } from 'lucide-react';
import { Workplace } from '../types';

interface Props {
  workplaces: Workplace[];
  onAddWorkplace: (wp: Workplace) => void;
}

export const AdminMapTab: React.FC<Props> = ({ workplaces, onAddWorkplace }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('50');
  const [loadingLoc, setLoadingLoc] = useState(false);

  // ฟังก์ชันดึงพิกัดปัจจุบันของผู้ดูแลระบบมาใส่ในฟอร์มทันที
  const useCurrentLocationAsWorkplace = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ Geolocation');
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLoadingLoc(false);
      },
      (err) => {
        alert('ดึงพิกัดไม่สำเร็จ: ' + err.message);
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCreateWorkplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lat || !lng) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const res = await fetch('/api/workplaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: code || `LOC-${Date.now().toString().slice(-4)}`,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radiusMeters: parseFloat(radius) || 50,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onAddWorkplace(data.data);
        setShowAddModal(false);
        setName('');
        setCode('');
        setLat('');
        setLng('');
        alert('เพิ่มสถานที่สำเร็จ! ✅');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเพิ่มสถานที่');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">จัดการสถานที่และรัศมี Geofence</h3>
            <p className="text-xs text-slate-500">กำหนดจุดพิกัดและระยะอนุญาตลงเวลาของแต่ละอาคาร</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสถานที่
        </button>
      </div>

      {/* Modal เพิ่มสถานที่ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              กำหนดจุดสถานที่ปฏิบัติงานใหม่
            </h3>

            <form onSubmit={handleCreateWorkplace} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ชื่อสถานที่ / อาคาร *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อาคารเฉลิมพระเกียรติ ชั้น 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  รหัสสถานที่ (Code)
                </label>
                <input
                  type="text"
                  placeholder="เช่น HQ-BLD-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ละติจูด (Lat) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="6.425556"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ลองจิจูด (Lng) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="101.825278"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={useCurrentLocationAsWorkplace}
                disabled={loadingLoc}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                {loadingLoc ? 'กำลังตรวจจับพิกัด...' : 'ใช้พิกัดปัจจุบันของฉันตรงนี้'}
              </button>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  รัศมีวงกลมที่อนุญาต (เมตร)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  แนะนำ 30-80 เมตร สำหรับอาคารสำนักงานทั่วไป
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  บันทึกสถานที่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* รายการสถานที่ทั้งหมด */}
      <div className="grid gap-3">
        {workplaces.map((wp) => (
          <div
            key={wp.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-sm">{wp.name}</h4>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {wp.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Lat: {wp.latitude.toFixed(6)}, Lng: {wp.longitude.toFixed(6)}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                รัศมี {wp.radiusMeters} ม.
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Dynamic QR Token: <strong className="text-slate-800">เปิดใช้งาน (20s Refresh)</strong>
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> พร้อมใช้งาน
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
