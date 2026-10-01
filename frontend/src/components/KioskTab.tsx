import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Monitor, Copy, Check, Clock, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Workplace, QRTokenResponse } from '../types';

interface Props {
  workplaces: Workplace[];
}

export const KioskTab: React.FC<Props> = ({ workplaces }) => {
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>('');
  const [tokenData, setTokenData] = useState<QRTokenResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(20);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  useEffect(() => {
    if (workplaces.length > 0 && !selectedWorkplaceId) {
      setSelectedWorkplaceId(workplaces[0].id);
    }
  }, [workplaces, selectedWorkplaceId]);

  // Digital clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ดึง Token Dynamic ทุกรอบเวลา หรือ Fallback ถ้ายังไม่ได้เปิด Backend
  const fetchToken = async () => {
    const wpId = selectedWorkplaceId || (workplaces.length > 0 ? workplaces[0].id : 'a0000000-0000-0000-0000-000000000001');
    const wpName = workplaces.find((w) => w.id === wpId)?.name || 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)';

    try {
      const res = await fetch(`/api/kiosk/token/${wpId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTokenData(data.data);
          setCountdown(data.data.expiresIn || 20);
          setBackendOnline(true);
          return;
        }
      }
      throw new Error('API response not ok');
    } catch {
      // Fallback Generator: คำนวณรหัส QR ฝั่ง Client ทันทีเพื่อไม่ให้หน้าจอค้างหมุน
      setBackendOnline(false);
      const now = Math.floor(Date.now() / 1000);
      const timeStep = Math.floor(now / 20);
      const remaining = 20 - (now % 20);
      const mockHash = Math.abs(timeStep * 31).toString(16).padEnd(8, '0').slice(0, 16);

      setTokenData({
        workplaceId: wpId,
        workplaceName: wpName,
        token: `GEO:${wpId}:${timeStep}:${mockHash}`,
        expiresIn: remaining,
      });
      setCountdown(remaining);
    }
  };

  useEffect(() => {
    fetchToken();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedWorkplaceId, workplaces]);

  const copyToken = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeWorkplace =
    workplaces.find((w) => w.id === selectedWorkplaceId) ||
    workplaces[0] || {
      name: 'อาคารวิทยบริการ มหาวิทยาลัยนราธิวาสราชนครินทร์ (โคกเขือ)',
    };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-20">
      {/* ส่วนควบคุมและเลือกสถานที่ */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Monitor className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-sm">โหมดจอประจำสำนักงาน (Kiosk Display)</span>
        </div>
        <select
          value={selectedWorkplaceId}
          onChange={(e) => setSelectedWorkplaceId(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-2 font-medium outline-none"
        >
          {workplaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* หน้าจอแสดงผล QR Code ขนาดใหญ่ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* สถานะการเชื่อมต่อ Backend */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {backendOnline ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Backend Online (Port 3001)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertCircle className="w-3 h-3 text-amber-400" /> กำลังรอ Backend (กำลังใช้โหมดสำรอง)
            </span>
          )}
        </div>

        {/* หัวเรื่องและสถานที่ */}
        <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-1">
          <Building2 className="w-4 h-4" />
          <span>{activeWorkplace?.name || 'สำนักงาน'}</span>
        </div>

        <div className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 font-mono flex items-center justify-center gap-2">
          <Clock className="w-8 h-8 text-blue-400" />
          <span>{currentTime || '08:30:00'}</span>
        </div>

        {/* QR Code Container (แสดงตลอดเวลา ไม่ค้างหมุน) */}
        <div className="inline-block p-4 md:p-6 bg-white rounded-3xl shadow-xl transition-transform transform hover:scale-[1.02]">
          {tokenData?.token ? (
            <QRCodeSVG
              value={tokenData.token}
              size={240}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          ) : (
            <QRCodeSVG
              value="https://aerea-attendance.local"
              size={240}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
          )}
        </div>

        {/* แถบนับถอยหลังการรีเฟรชรหัส */}
        <div className="mt-6 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
            <span>รหัสจะหมุนเวียนในอีก</span>
            <span className="text-amber-400 font-bold">{countdown} วินาที</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-400 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Token Text & Copy Helper for Testing */}
        {tokenData && (
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center gap-2">
            <span className="font-mono text-xs text-slate-400 truncate max-w-[240px]">
              {tokenData.token}
            </span>
            <button
              type="button"
              onClick={copyToken}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก Token'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
        <p className="font-bold mb-1">💡 คำแนะนำการติดตั้งใช้งาน:</p>
        <p>
          หน้าจอนี้เหมาะสำหรับเปิดบนแท็บเล็ต iPad หรือหน้าจอ Monitor ที่ทางเข้าสำนักงาน
          บุคลากรจะใช้กล้องโทรศัพท์มือถือสแกน QR นี้ควบคู่กับระบบ Geofencing เพื่อเช็กอินเข้า-ออกงาน
        </p>
      </div>
    </div>
  );
};
