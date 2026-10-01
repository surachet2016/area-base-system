import React, { useState, useEffect } from 'react';
import {
  MapPin,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Navigation,
  Sparkles,
  Camera,
  X,
  Radio,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Workplace, AttendanceRecord } from '../types';
import { calculateHaversineDistance } from '../utils/geo';

interface Props {
  workplaces: Workplace[];
  onCheckInSuccess: (record: AttendanceRecord) => void;
}

export const CheckInTab: React.FC<Props> = ({ workplaces, onCheckInSuccess }) => {
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [qrToken, setQrToken] = useState<string>('');
  const [recordType, setRecordType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // เลือกสถานที่เริ่มต้น
  useEffect(() => {
    if (workplaces.length > 0 && !selectedWorkplaceId) {
      setSelectedWorkplaceId(workplaces[0].id);
    }
  }, [workplaces, selectedWorkplaceId]);

  const activeWorkplace = workplaces.find((w) => w.id === selectedWorkplaceId);

  // ดึงพิกัด GPS จริงจาก Browser / Mobile (บังคับ Refresh ทันที)
  const fetchCurrentLocation = () => {
    setLocationError(null);
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationError('อุปกรณ์หรือเบราว์เซอร์ไม่รองรับ Geolocation API');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsLocating(false);
      },
      (err) => {
        setLocationError(`ไม่สามารถดึงตำแหน่งพิกัดได้: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // ติดตามพิกัดดาวเทียมแบบเรียลไทม์ต่อเนื่อง (Continuous GPS Stream)
  useEffect(() => {
    fetchCurrentLocation();

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // เมื่อผู้ใช้เปลี่ยนสถานที่ใน dropdown ให้รีเฟรชพิกัดใหม่ทันที
  useEffect(() => {
    fetchCurrentLocation();
  }, [selectedWorkplaceId]);

  // ระบบสแกนกล้อง QR ด้วย html5-qrcode
  useEffect(() => {
    let qrScanner: Html5Qrcode | null = null;
    if (isScanning) {
      qrScanner = new Html5Qrcode('qr-reader');
      qrScanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            setQrToken(decodedText);
            if (qrScanner && qrScanner.isScanning) {
              qrScanner.stop().then(() => setIsScanning(false)).catch(console.error);
            }
          },
          () => {}
        )
        .catch((err) => {
          alert('ไม่สามารถเปิดกล้องได้: ' + err);
          setIsScanning(false);
        });
    }

    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  // คำนวณระยะห่าง
  const distance =
    userCoords && activeWorkplace
      ? calculateHaversineDistance(
          userCoords.lat,
          userCoords.lng,
          activeWorkplace.latitude,
          activeWorkplace.longitude
        )
      : null;

  // รวม GPS drift tolerance ในอาคาร (สูงสุด 35 ม.)
  const accuracyTolerance = userCoords ? Math.min(Math.max(0, userCoords.accuracy * 0.5), 35) : 0;
  const totalAllowedRadius = activeWorkplace ? activeWorkplace.radiusMeters + accuracyTolerance : 50;

  const isWithinRadius =
    distance !== null && activeWorkplace ? distance <= totalAllowedRadius : false;

  // ฟังก์ชันช่วยดึง Token จากหน้าจอ Kiosk อัตโนมัติ
  const autoFillActiveToken = async () => {
    if (!activeWorkplace) return;
    try {
      const res = await fetch(`/api/kiosk/token/${activeWorkplace.id}`);
      const data = await res.json();
      if (data.success) {
        setQrToken(data.data.token);
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อดึง Token อัตโนมัติได้');
    }
  };

  // จำลองพิกัดเพื่อการทดสอบ
  const simulateCoords = (mode: 'inside' | 'outside') => {
    if (!activeWorkplace) return;
    if (mode === 'inside') {
      setUserCoords({
        lat: activeWorkplace.latitude + 0.00003, // ห่างประมาณ 3-5 เมตร
        lng: activeWorkplace.longitude + 0.00003,
        accuracy: 5,
      });
    } else {
      setUserCoords({
        lat: activeWorkplace.latitude + 0.005, // ห่างประมาณ 550 เมตร
        lng: activeWorkplace.longitude + 0.005,
        accuracy: 12,
      });
    }
  };

  // ส่งข้อมูลบันทึกเวลา
  const handleSubmitAttendance = async () => {
    if (!activeWorkplace) {
      alert('กรุณาเลือกสถานที่ปฏิบัติงาน');
      return;
    }
    if (!userCoords) {
      alert('กรุณารอระบบตรวจจับพิกัด GPS หรือกดปุ่มดึงพิกัด');
      return;
    }
    if (!qrToken.trim()) {
      alert('กรุณากรอกหรือสแกน Dynamic QR Token ก่อนกดบันทึก');
      return;
    }

    setLoading(true);
    setResultMessage(null);

    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: 'b0000000-0000-0000-0000-000000000001',
          workplaceId: activeWorkplace.id,
          token: qrToken.trim(),
          userLat: userCoords.lat,
          userLng: userCoords.lng,
          accuracyMeters: userCoords.accuracy,
          recordType,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setResultMessage({
          type: 'success',
          text: data.message || 'บันทึกเวลาสำเร็จ!',
          details: data.data,
        });
        onCheckInSuccess(data.data);
      } else {
        setResultMessage({
          type: 'error',
          text: data.message || 'บันทึกเวลาไม่สำเร็จ',
          details: data.data,
        });
      }
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ Backend: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Modal สแกนกล้อง QR Code */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm relative text-center shadow-2xl">
            <button
              onClick={() => setIsScanning(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-slate-800 mb-2 flex items-center justify-center gap-1.5">
              <Camera className="w-5 h-5 text-blue-600" />
              สแกน QR Code หน้างาน
            </h3>
            <p className="text-xs text-slate-500 mb-4">หันกล้องไปที่หน้าจอ Kiosk เพื่ออ่านรหัส Token</p>
            <div id="qr-reader" className="w-full overflow-hidden rounded-2xl bg-black min-h-[260px]" />
          </div>
        </div>
      )}

      {/* ส่วนหัวแสดงประเภทการลงเวลา */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          เลือกประเภทการลงเวลา
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRecordType('CHECK_IN')}
            className={`py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              recordType === 'CHECK_IN'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            เข้างาน (Check-In)
          </button>
          <button
            type="button"
            onClick={() => setRecordType('CHECK_OUT')}
            className={`py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              recordType === 'CHECK_OUT'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            ออกงาน (Check-Out)
          </button>
        </div>
      </div>

      {/* เลือกสถานที่ปฏิบัติงาน */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          สถานที่ปฏิบัติงาน (Workplace)
        </label>
        <select
          value={selectedWorkplaceId}
          onChange={(e) => setSelectedWorkplaceId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
        >
          {workplaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} (รัศมี {w.radiusMeters} ม.)
            </option>
          ))}
        </select>
      </div>

      {/* เรดาร์ Geofence สถานะพิกัด GPS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center">
        <div className="relative inline-flex items-center justify-center mb-3">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isWithinRadius
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-full radar-pulse ${
                isWithinRadius ? 'bg-emerald-400/20' : 'bg-amber-400/20'
              }`}
            />
            <MapPin className="w-10 h-10 relative z-10" />
          </div>
        </div>

        <h3 className="font-bold text-slate-800 text-base">
          {isWithinRadius ? 'คุณอยู่ในพื้นที่ปฏิบัติงานแล้ว ✅' : 'คุณยังอยู่นอกพื้นที่ที่กำหนด ⚠️'}
        </h3>

        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          <span>ระยะห่าง:</span>
          <span className="font-bold text-slate-900">
            {distance !== null ? `${distance} เมตร` : 'กำลังคำนวณ...'}
          </span>
          <span className="text-slate-400">|</span>
          <span>รัศมีอนุญาต: {Math.round(totalAllowedRadius)} ม.</span>
        </div>

        {/* ข้อมูล GPS ผู้ใช้ */}
        {userCoords && (
          <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-center gap-1">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            พิกัดสด: {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)} (±{userCoords.accuracy} ม.)
          </p>
        )}

        {locationError && (
          <div className="mt-2 text-xs text-rose-500 bg-rose-50 p-2 rounded-lg">
            {locationError}
          </div>
        )}

        {/* ปุ่มลัดจัดการพิกัดสำหรับการทดสอบ */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-center text-xs">
          <button
            type="button"
            onClick={fetchCurrentLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'กำลังดึงพิกัดจากดาวเทียม...' : 'รีเฟรชพิกัด GPS สด'}
          </button>
          <button
            type="button"
            onClick={() => simulateCoords('inside')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium"
          >
            จำลอง: ในรัศมี (5 ม.)
          </button>
          <button
            type="button"
            onClick={() => simulateCoords('outside')}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium"
          >
            จำลอง: นอกรัศมี (550 ม.)
          </button>
        </div>
      </div>

      {/* Dynamic QR Code Verification Factor */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-blue-600" />
            Dynamic QR Token (สแกนหน้างาน)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScanning(true)}
              className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg font-semibold flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              เปิดกล้องสแกน
            </button>
            <button
              type="button"
              onClick={autoFillActiveToken}
              className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              ดึง Token
            </button>
          </div>
        </div>

        <input
          type="text"
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          placeholder="วางรหัส Token หรือกดปุ่มเปิดกล้องสแกน"
          className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
        />

        <p className="text-[11px] text-slate-400">
          💡 สแกนจากหน้าจอ Kiosk หรือกดปุ่ม "ดึง Token" เพื่อทดสอบทันที
        </p>
      </div>

      {/* ผลลัพธ์การลงเวลา */}
      {resultMessage && (
        <div
          className={`p-4 rounded-2xl border ${
            resultMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {resultMessage.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-sm">{resultMessage.text}</h4>
              {resultMessage.details && (
                <div className="text-xs mt-1 text-slate-600 space-y-0.5">
                  <p>สถานที่: {resultMessage.details.workplaceName}</p>
                  <p>
                    เวลา:{' '}
                    {new Date(
                      resultMessage.details.recordedAt || Date.now()
                    ).toLocaleTimeString('th-TH')}
                  </p>
                  <p>สถานะ: {resultMessage.details.status === 'LATE' ? 'มาสาย' : 'ตรงเวลา'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ปุ่มกดเช็กอินขนาดใหญ่ */}
      <button
        type="button"
        disabled={loading}
        onClick={handleSubmitAttendance}
        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
          loading
            ? 'bg-slate-400 text-white cursor-not-allowed'
            : isWithinRadius
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.98]'
            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            กำลังตรวจสอบพิกัดและบันทึกเวลา...
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            ยืนยันการบันทึกเวลา ({recordType === 'CHECK_IN' ? 'เข้างาน' : 'ออกงาน'})
          </>
        )}
      </button>
    </div>
  );
};
