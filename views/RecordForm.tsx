
import React, { useState, useEffect } from 'react';
import { User, RecordType, AppRecord, TravelRecord, FuelRecord, MaintenanceRecord } from '../types';
import { dataService, carService } from '../services/storage';
import { Button, Card, Input, Select } from '../components/UI';
import { PhotoUpload } from '../components/PhotoUpload';
import { GOOGLE_APPS_SCRIPT_URL } from '../constants';

interface RecordFormProps {
  user: User;
  initialType?: string;
  initialData?: AppRecord | null;
  isAdminMode?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({ user, initialType = 'travel', initialData, isAdminMode = false, onSuccess, onCancel }) => {
  const [activeTab, setActiveTab] = useState<RecordType>(
    initialType === 'fuel' ? RecordType.FUEL : 
    initialType === 'maintenance' ? RecordType.MAINTENANCE : 
    RecordType.TRAVEL
  );
  const [loading, setLoading] = useState(false);
  const [carOptions, setCarOptions] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const cars = await carService.getCars();
        setCarOptions(cars.map(c => ({ id: c.id, name: c.name })));
      } catch (e) {
        console.error("Failed to load cars", e);
      }
    };
    loadCars();
  }, []);

  const [common, setCommon] = useState({ carId: '' });

  const getCurrentDateTime = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    return { dateStr, timeStr };
  };

  const { dateStr: defaultDate, timeStr: defaultTime } = getCurrentDateTime();

  const [travel, setTravel] = useState({
    locationFrom: 'โรงเรียนบ้านป่าเสร้า',
    locationTo: '',
    tripDateStart: defaultDate,
    tripTimeStart: defaultTime,
    tripDateEnd: defaultDate,
    tripTimeEnd: defaultTime,
    purpose: '',
    photoBefore: null as string | null,
    photoArrival: null as string | null,
    photoReturn: null as string | null,
  });

  const [fuel, setFuel] = useState({
    amount: '0',
    cost: '',
    station: '',
    photo: null as string | null,
    date: defaultDate,
    time: defaultTime
  });

  const [maint, setMaint] = useState({
    description: '',
    cost: '',
    garage: '',
    photo: null as string | null,
    date: defaultDate,
    time: defaultTime
  });

  useEffect(() => {
    if (initialData) {
        setActiveTab(initialData.type);
        setCommon({ carId: initialData.carId });
        if (initialData.type === RecordType.TRAVEL) {
            const d = initialData as TravelRecord;
            setTravel({
                locationFrom: d.locationFrom,
                locationTo: d.locationTo,
                tripDateStart: d.tripDateStart,
                tripTimeStart: d.tripTimeStart,
                tripDateEnd: d.tripDateEnd,
                tripTimeEnd: d.tripTimeEnd,
                purpose: d.purpose,
                photoBefore: d.photos.before,
                photoArrival: d.photos.arrival,
                photoReturn: d.photos.return
            });
        } else if (initialData.type === RecordType.FUEL) {
            const d = initialData as FuelRecord;
            setFuel({
                amount: '0',
                cost: d.cost.toString(),
                station: d.station,
                photo: d.photo,
                date: d.date,
                time: d.time
            });
        } else if (initialData.type === RecordType.MAINTENANCE) {
            const d = initialData as MaintenanceRecord;
            setMaint({
                description: d.description,
                cost: d.cost.toString(),
                garage: d.garage,
                photo: d.photo,
                date: d.date,
                time: d.time
            });
        }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!common.carId) return alert('กรุณาเลือกรถยนต์');

    setLoading(true);
    try {
      const now = new Date();
      let recordDate = now.toISOString().split('T')[0];
      let recordTime = now.toTimeString().slice(0, 5);

      if (activeTab === RecordType.FUEL) {
          recordDate = fuel.date;
          recordTime = fuel.time;
      } else if (activeTab === RecordType.MAINTENANCE) {
          recordDate = maint.date;
          recordTime = maint.time;
      } else if (activeTab === RecordType.TRAVEL && initialData) {
          recordDate = initialData.date;
          recordTime = initialData.time;
      }

      const base = {
        ...common,
        date: recordDate,
        time: recordTime,
        driverName: initialData ? initialData.driverName : user.fullName, 
        userId: initialData ? initialData.userId : user.id,
        type: activeTab,
        lastModifiedBy: isAdminMode ? 'ผู้ดูแลระบบ (Admin)' : user.fullName,
        lastModifiedRole: isAdminMode ? 'ADMIN' : 'USER', 
        lastModifiedAt: now.toISOString(),
      };

      let payload;
      if (activeTab === RecordType.TRAVEL) {
        if (!travel.tripDateStart || !travel.tripTimeStart || !travel.tripDateEnd || !travel.tripTimeEnd) {
             setLoading(false);
             return alert('กรุณากรอกวันเวลาเดินทางไป-กลับ ให้ครบถ้วน');
        }
        if (!travel.photoBefore || !travel.photoArrival || !travel.photoReturn) {
             if(!confirm('คุณยังแนบภาพไม่ครบ 3 ภาพ (ก่อนเดินทาง, ถึงที่หมาย, กลับถึงโรงเรียน) ยืนยันจะบันทึก?')) {
                 setLoading(false);
                 return;
             }
        }
        payload = {
          ...base,
          locationFrom: travel.locationFrom,
          locationTo: travel.locationTo,
          tripDateStart: travel.tripDateStart,
          tripTimeStart: travel.tripTimeStart,
          tripDateEnd: travel.tripDateEnd,
          tripTimeEnd: travel.tripTimeEnd,
          purpose: travel.purpose,
          photos: { before: travel.photoBefore, arrival: travel.photoArrival, return: travel.photoReturn },
        };
      } else if (activeTab === RecordType.FUEL) {
        payload = { ...base, amount: 0, cost: Number(fuel.cost), station: fuel.station, photo: fuel.photo };
      } else {
        payload = { ...base, description: maint.description, cost: Number(maint.cost), garage: maint.garage, photo: maint.photo };
      }

      if (initialData) {
          await dataService.updateRecord({ ...payload, id: initialData.id, timestamp: initialData.timestamp } as AppRecord);
      } else {
          await dataService.saveRecord(payload as any);
      }
      alert('บันทึกเรียบร้อยแล้ว');
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: RecordType.TRAVEL, label: 'เดินทาง', icon: '🚗', color: 'bg-blue-100 text-blue-600' },
    { id: RecordType.FUEL, label: 'เติมน้ำมัน', icon: '⛽', color: 'bg-emerald-100 text-emerald-600' },
    { id: RecordType.MAINTENANCE, label: 'ซ่อมบำรุง', icon: '🔧', color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="animate-fade-in pb-10">
      {initialData || isAdminMode ? (
          <div className="bg-accent-400/10 border-2 border-accent-400/50 p-4 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-center shadow-lg shadow-accent-400/10">
              <span className="text-accent-600 font-bold flex items-center text-lg">
                  <span className="bg-accent-400 text-white p-1 rounded-md mr-2">⚡</span>
                  {initialData ? 'โหมดแก้ไขข้อมูล' : 'โหมดเพิ่มข้อมูล'} <span className="text-sm font-normal ml-1 text-slate-500">(สำหรับผู้ดูแลระบบ)</span>
              </span>
          </div>
      ) : (
        <div className="flex mb-8 bg-white rounded-full p-1.5 shadow-lg shadow-slate-200/50 border border-slate-100">
            {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center ${
                activeTab === tab.id 
                    ? 'bg-school-500 text-white shadow-md transform scale-100' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
                <span className={`mr-2 p-1 rounded-full bg-white/20 ${activeTab !== tab.id ? 'grayscale opacity-50' : ''}`}>{tab.icon}</span>
                {tab.label}
            </button>
            ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card title="ข้อมูลทั่วไป" icon="📝" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="เลือกรถ" 
              options={carOptions.map(c => c.name)} 
              required
              value={common.carId}
              onChange={e => setCommon({...common, carId: e.target.value})}
              className="bg-school-50/50"
            />
            <Input 
              label="ผู้ขับขี่ / ผู้รับผิดชอบ" 
              required
              value={initialData ? initialData.driverName : user.fullName}
              readOnly={!isAdminMode} 
              className="bg-slate-100 text-slate-500 border-slate-100 cursor-not-allowed"
            />
             {activeTab === RecordType.TRAVEL && (
                <div className="md:col-span-2 text-xs text-school-500 font-medium bg-school-50 p-2 rounded-lg border border-school-100 inline-block">
                    ℹ️ วันและเวลาที่บันทึกจะถูกกำหนดโดยอัตโนมัติตามเวลาปัจจุบัน
                </div>
             )}
          </div>
        </Card>

        {activeTab === RecordType.TRAVEL && (
          <div className="space-y-6">
             <Card title="รายละเอียดการเดินทาง" icon="🗺️">
                <div className="space-y-4">
                    <Input 
                    label="สถานที่ไป (ปลายทาง)" 
                    required 
                    placeholder="เช่น สำนักงานเขตพื้นที่การศึกษา"
                    value={travel.locationTo}
                    onChange={e => setTravel({...travel, locationTo: e.target.value})}
                    />
                    <Input 
                    label="สถานที่กลับ (ต้นทาง)" 
                    value={travel.locationFrom}
                    onChange={e => setTravel({...travel, locationFrom: e.target.value})}
                    />
                </div>
                
                <div className="p-5 bg-blue-50/80 rounded-3xl border-2 border-blue-100 space-y-4 mt-6">
                    <h4 className="font-bold text-blue-800 text-sm flex items-center">
                        <span className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></span>
                        ช่วงเวลาการเดินทาง
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="วันที่ไป" type="date" required value={travel.tripDateStart} onChange={e => setTravel({...travel, tripDateStart: e.target.value})} className="bg-white" />
                        <Input label="เวลาไป" type="time" required value={travel.tripTimeStart} onChange={e => setTravel({...travel, tripTimeStart: e.target.value})} className="bg-white" />
                        <Input label="วันที่กลับ" type="date" required value={travel.tripDateEnd} onChange={e => setTravel({...travel, tripDateEnd: e.target.value})} className="bg-white" />
                        <Input label="เวลากลับ" type="time" required value={travel.tripTimeEnd} onChange={e => setTravel({...travel, tripTimeEnd: e.target.value})} className="bg-white" />
                    </div>
                </div>

                <div className="mt-4">
                    <Input 
                    label="วัตถุประสงค์ / หมายเหตุ" 
                    required
                    value={travel.purpose}
                    onChange={e => setTravel({...travel, purpose: e.target.value})}
                    />
                </div>
             </Card>

             <Card title="หลักฐานภาพถ่าย" icon="📸">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PhotoUpload label="1. ก่อนเดินทาง (ภาพคู่กับรถ)" value={travel.photoBefore} onChange={(v) => setTravel({...travel, photoBefore: v})} required />
                    <PhotoUpload label="2. ถึงที่หมาย (ภาพสถานที่)" value={travel.photoArrival} onChange={(v) => setTravel({...travel, photoArrival: v})} required />
                     <PhotoUpload label="3. กลับถึงโรงเรียน (ภาพคู่กับรถ)" value={travel.photoReturn} onChange={(v) => setTravel({...travel, photoReturn: v})} required />
                </div>
             </Card>
          </div>
        )}

        {activeTab === RecordType.FUEL && (
           <div className="space-y-6">
             <Card title="รายละเอียดการเติมน้ำมัน" icon="⛽">
                <div className="grid grid-cols-2 gap-4 mb-6 p-5 bg-emerald-50/80 rounded-3xl border-2 border-emerald-100">
                    <Input label="วันที่เติม" type="date" required value={fuel.date} onChange={e => setFuel({...fuel, date: e.target.value})} className="bg-white" />
                    <Input label="เวลา" type="time" required value={fuel.time} onChange={e => setFuel({...fuel, time: e.target.value})} className="bg-white" />
                </div>
                <Input label="จำนวนเงิน (บาท)" type="number" step="0.01" required value={fuel.cost} onChange={e => setFuel({...fuel, cost: e.target.value})} className="text-2xl font-bold text-emerald-600" placeholder="0.00" />
                <Input label="สถานีบริการน้ำมัน / สถานที่" required value={fuel.station} onChange={e => setFuel({...fuel, station: e.target.value})} />
                <div className="mt-6"><PhotoUpload label="รูปภาพใบเสร็จ หรือ หน้าปัด" value={fuel.photo} onChange={(v) => setFuel({...fuel, photo: v})} required /></div>
             </Card>
           </div>
        )}

        {activeTab === RecordType.MAINTENANCE && (
           <div className="space-y-6">
             <Card title="รายละเอียดการซ่อมบำรุง" icon="🔧">
                 <div className="grid grid-cols-2 gap-4 mb-6 p-5 bg-orange-50/80 rounded-3xl border-2 border-orange-100">
                    <Input label="วันที่ซ่อม" type="date" required value={maint.date} onChange={e => setMaint({...maint, date: e.target.value})} className="bg-white" />
                    <Input label="เวลา" type="time" required value={maint.time} onChange={e => setMaint({...maint, time: e.target.value})} className="bg-white" />
                </div>
                <Input label="รายการซ่อม / อาการ" required value={maint.description} onChange={e => setMaint({...maint, description: e.target.value})} />
                <Input label="อู่ / ร้าน / ศูนย์บริการ" required value={maint.garage} onChange={e => setMaint({...maint, garage: e.target.value})} />
                <Input label="ค่าใช้จ่าย (บาท)" type="number" step="0.01" required value={maint.cost} onChange={e => setMaint({...maint, cost: e.target.value})} className="text-2xl font-bold text-orange-600" placeholder="0.00" />
                 <div className="mt-6"><PhotoUpload label="รูปภาพใบเสร็จ / อะไหล่" value={maint.photo} onChange={(v) => setMaint({...maint, photo: v})} required /></div>
             </Card>
           </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 md:relative md:bg-transparent md:border-0 md:p-0 md:mt-8 z-30">
          <div className="max-w-5xl mx-auto flex space-x-4">
            <Button type="button" variant="secondary" className="flex-1 rounded-2xl" onClick={onCancel} disabled={loading}>ยกเลิก</Button>
            <Button type="submit" className="flex-[2] rounded-2xl shadow-lg shadow-school-500/30" isLoading={loading}>
                {initialData ? 'บันทึกการแก้ไข' : 'ยืนยันการบันทึก'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
