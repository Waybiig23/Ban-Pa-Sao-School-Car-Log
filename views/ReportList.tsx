
import React, { useEffect, useState } from 'react';
import { AppRecord, RecordType, TravelRecord, FuelRecord, MaintenanceRecord, Car, User } from '../types';
import { dataService, carService, adminService } from '../services/storage';
import { generateReportSummary } from '../services/geminiService';
import { Button, Modal } from '../components/UI';
// @ts-ignore
import { utils, writeFile } from 'xlsx';

interface ReportListProps {
    onBack: () => void;
    onEdit?: (record: AppRecord) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ onBack }) => {
    const [records, setRecords] = useState<AppRecord[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState<string>('ALL');
    const [selectedRecord, setSelectedRecord] = useState<AppRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recordData, carData, userData] = await Promise.all([
                dataService.getRecords(),
                carService.getCars(),
                adminService.getAllUsers()
            ]);
            setRecords(recordData);
            setCars(carData);
            setUsers(userData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = records.filter(r => filter === 'ALL' || r.type === filter);

    const handleCardClick = (record: AppRecord) => {
        setSelectedRecord(record);
        setAiSummary('');
    };

    const handleExportExcel = () => {
        if (filteredRecords.length === 0) return alert('ไม่มีข้อมูลสำหรับส่งออก');
        const dataToExport = filteredRecords.map(r => {
            const base = {
                'วันที่บันทึก': r.date,
                'เวลาบันทึก': r.time,
                'ประเภท': r.type === RecordType.TRAVEL ? 'การเดินทาง' : r.type === RecordType.FUEL ? 'เติมน้ำมัน' : 'ซ่อมบำรุง',
                'ทะเบียนรถ/ชื่อรถ': r.carId,
                'ผู้บันทึก/ผู้ขับ': r.driverName,
            };
            if (r.type === RecordType.TRAVEL) {
                const t = r as TravelRecord;
                return { 
                    ...base, 
                    'รายละเอียด': `ไป: ${t.locationTo}`, 
                    'หมายเหตุ': t.purpose,
                    'วันเดินทางไป': t.tripDateStart + ' ' + t.tripTimeStart,
                    'วันเดินทางกลับ': t.tripDateEnd + ' ' + t.tripTimeEnd
                };
            } else if (r.type === RecordType.FUEL) {
                const f = r as FuelRecord;
                return { ...base, 'รายละเอียด': f.station, 'ค่าใช้จ่าย': f.cost };
            } else {
                const m = r as MaintenanceRecord;
                return { ...base, 'รายละเอียด': m.garage, 'ค่าใช้จ่าย': m.cost, 'หมายเหตุ': m.description };
            }
        });
        const ws = utils.json_to_sheet(dataToExport);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Report");
        writeFile(wb, `Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleGenerateSummary = async () => {
      if (!selectedRecord) return;
      setLoadingAi(true);
      let textToSummarize = `ประเภท: ${selectedRecord.type}, วันที่: ${selectedRecord.date}, รถ: ${selectedRecord.carId}. `;
      if (selectedRecord.type === RecordType.TRAVEL) textToSummarize += `ไป: ${(selectedRecord as TravelRecord).locationTo}`;
      const summary = await generateReportSummary(textToSummarize);
      setAiSummary(summary);
      setLoadingAi(false);
    };

    const getCarPhoto = (carName: string) => cars.find(c => c.name === carName)?.photo || null;
    const getUserPhoto = (userId: string) => users.find(u => u.id === userId)?.photo || null;

    return (
        <div className="pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-school-900">ประวัติการใช้งาน</h2>
                    <p className="text-slate-500 text-sm">รายการบันทึกทั้งหมดของโรงเรียน</p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handleExportExcel} variant="yellow" className="text-sm px-4 py-2 shadow-md">
                        <span className="mr-1">📂</span> Export Excel
                    </Button>
                    <Button variant="secondary" onClick={onBack} className="text-sm px-4 py-2 rounded-full bg-white border-slate-200">ย้อนกลับ</Button>
                </div>
            </div>

            <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 no-scrollbar">
                {['ALL', 'TRAVEL', 'FUEL', 'MAINTENANCE'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${filter === t ? 'bg-school-500 text-white shadow-md transform scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {t === 'ALL' ? 'ทั้งหมด' : t === 'TRAVEL' ? '🚗 เดินทาง' : t === 'FUEL' ? '⛽ น้ำมัน' : '🔧 ซ่อมบำรุง'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-school-200 border-t-school-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-400 animate-pulse">กำลังโหลดข้อมูล...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <span className="text-4xl block mb-2">📭</span>
                            <span className="text-slate-400 font-medium">ไม่พบข้อมูลในหมวดนี้</span>
                        </div>
                    ) : (
                        filteredRecords.map(record => (
                            <div 
                                key={record.id} 
                                onClick={() => handleCardClick(record)}
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-school-200 transition-all cursor-pointer flex justify-between items-center group"
                            >
                                <div className="flex items-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mr-4 shadow-inner ${
                                        record.type === RecordType.TRAVEL ? 'bg-blue-50 text-blue-500' :
                                        record.type === RecordType.FUEL ? 'bg-emerald-50 text-emerald-500' :
                                        'bg-orange-50 text-orange-500'
                                    }`}>
                                        {record.type === RecordType.TRAVEL ? '🚗' : record.type === RecordType.FUEL ? '⛽' : '🔧'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-base line-clamp-1 group-hover:text-school-600 transition-colors">
                                            {record.type === RecordType.TRAVEL ? (record as TravelRecord).locationTo :
                                             record.type === RecordType.MAINTENANCE ? (record as MaintenanceRecord).description :
                                             `เติมน้ำมัน ${(record as FuelRecord).cost.toLocaleString()} บาท`}
                                        </h4>
                                        <div className="flex flex-wrap items-center text-xs text-slate-400 mt-1 gap-y-1">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md mr-2 font-medium text-slate-500">{record.carId}</span>
                                            <span className="mr-2">{record.date} • {record.driverName.split(' ')[0]}</span>
                                            {record.type === RecordType.TRAVEL && (
                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap font-medium">
                                                    📅 {(record as TravelRecord).tripDateStart} - {(record as TravelRecord).tripDateEnd}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-school-50 group-hover:text-school-500 transition-colors">
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Detail Modal (Reusing previous logic but with updated styling classes inherited from Modal component) */}
            <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="รายละเอียดรายการ">
                {selectedRecord && (
                    <div className="space-y-6">
                        {/* Info Cards */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                             <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                                 <span className="text-slate-500 text-sm">วันที่บันทึก</span>
                                 <span className="font-bold text-slate-700">{selectedRecord.date} <span className="text-slate-400 font-normal">|</span> {selectedRecord.time}</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {getUserPhoto(selectedRecord.userId) ? <img src={getUserPhoto(selectedRecord.userId)!} className="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white shadow-sm" /> : <div className="w-8 h-8 bg-slate-200 rounded-full mr-2"></div>}
                                    <span className="text-sm font-medium text-slate-700">{selectedRecord.driverName}</span>
                                </div>
                                <div className="text-xs bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">ผู้รับผิดชอบ</div>
                             </div>
                        </div>

                        <div className="bg-school-50 rounded-2xl p-4 border border-school-100 flex items-center justify-between">
                            <div className="flex items-center">
                                 {getCarPhoto(selectedRecord.carId) ? <img src={getCarPhoto(selectedRecord.carId)!} className="w-12 h-12 rounded-xl object-cover mr-3 border-2 border-white shadow-sm cursor-pointer" onClick={() => setFullscreenImage(getCarPhoto(selectedRecord.carId!)!)} /> : <div className="w-12 h-12 bg-white rounded-xl mr-3 flex items-center justify-center text-2xl">🚌</div>}
                                 <div>
                                     <span className="text-xs text-school-600 font-bold uppercase tracking-wider">ยานพาหนะ</span>
                                     <div className="font-bold text-school-900">{selectedRecord.carId}</div>
                                 </div>
                            </div>
                        </div>

                        {/* Specific Details */}
                        <div>
                            {selectedRecord.type === RecordType.TRAVEL && <TravelDetail record={selectedRecord as TravelRecord} onImageClick={setFullscreenImage} />}
                            {selectedRecord.type === RecordType.FUEL && <FuelDetail record={selectedRecord as FuelRecord} onImageClick={setFullscreenImage} />}
                            {selectedRecord.type === RecordType.MAINTENANCE && <MaintDetail record={selectedRecord as MaintenanceRecord} onImageClick={setFullscreenImage} />}
                        </div>

                        {/* Gemini AI */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="text-indigo-800 font-bold text-sm flex items-center">
                                    <span className="bg-white w-6 h-6 rounded-full flex items-center justify-center mr-2 shadow-sm text-xs">✨</span> AI Summary
                                </h4>
                                {!aiSummary && <button onClick={handleGenerateSummary} disabled={loadingAi} className="text-xs bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full transition-colors shadow-sm">{loadingAi ? '...' : 'สรุปข้อมูล'}</button>}
                             </div>
                             {aiSummary && <p className="text-sm text-indigo-700 leading-relaxed bg-white/50 p-3 rounded-xl">{aiSummary}</p>}
                        </div>
                    </div>
                )}
            </Modal>
            
            {fullscreenImage && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={() => setFullscreenImage(null)}>
                    <img src={fullscreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
};

const TravelDetail: React.FC<{ record: TravelRecord, onImageClick: (img: string) => void }> = ({ record, onImageClick }) => (
    <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
            <h5 className="font-bold text-blue-800 mb-3 flex items-center">
                <span className="mr-2">🕒</span> วันเวลาเดินทาง
            </h5>
            <div className="grid grid-cols-2 gap-4 bg-white/50 rounded-xl p-3">
                <div className="border-r border-blue-200 pr-2">
                    <span className="text-xs text-blue-400 uppercase block mb-1">ขาไป</span>
                    <span className="font-bold text-blue-900 text-sm block">{record.tripDateStart}</span>
                    <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded inline-block mt-1">{record.tripTimeStart} น.</span>
                </div>
                <div className="text-right pl-2">
                    <span className="text-xs text-blue-400 uppercase block mb-1">ขากลับ</span>
                    <span className="font-bold text-blue-900 text-sm block">{record.tripDateEnd}</span>
                    <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded inline-block mt-1">{record.tripTimeEnd} น.</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h5 className="font-bold text-slate-700 mb-2 flex items-center"><span className="text-xl mr-2">📍</span> เส้นทาง</h5>
            <div className="pl-2 border-l-2 border-slate-200 space-y-3 ml-2">
                <div><span className="text-xs text-slate-400 uppercase block">จาก</span><span className="text-sm font-medium">{record.locationFrom}</span></div>
                <div><span className="text-xs text-slate-400 uppercase block">ถึง</span><span className="text-sm font-medium">{record.locationTo}</span></div>
                <div><span className="text-xs text-slate-400 uppercase block">หมายเหตุ</span><span className="text-sm font-medium text-slate-600">{record.purpose}</span></div>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
             <h5 className="font-bold text-slate-700 mb-2">📸 ภาพประกอบ</h5>
             <div className="grid grid-cols-3 gap-3">
                 {[record.photos.before, record.photos.arrival, record.photos.return].map((img, idx) => (
                     img && <div key={idx} onClick={() => onImageClick(img)} className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-school-400 transition-all"><img src={img} className="w-full h-full object-cover" /></div>
                 ))}
             </div>
        </div>
    </div>
);

const FuelDetail: React.FC<{ record: FuelRecord, onImageClick: (img: string) => void }> = ({ record, onImageClick }) => (
    <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center">
            <span className="text-emerald-600 text-sm font-bold uppercase">ยอดรวม</span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{record.cost.toLocaleString()} ฿</div>
            <div className="text-emerald-600 text-sm mt-1">{record.station}</div>
        </div>
        {record.photo && <div onClick={() => onImageClick(record.photo!)} className="col-span-2 h-48 bg-slate-100 rounded-2xl overflow-hidden cursor-pointer relative group"><img src={record.photo} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-white/90 text-xs px-2 py-1 rounded-full font-bold">ดูรูป</span></div></div>}
    </div>
);

const MaintDetail: React.FC<{ record: MaintenanceRecord, onImageClick: (img: string) => void }> = ({ record, onImageClick }) => (
     <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center">
            <span className="text-orange-600 text-sm font-bold uppercase">ค่าซ่อม</span>
            <div className="text-3xl font-extrabold text-orange-700 mt-1">{record.cost.toLocaleString()} ฿</div>
            <div className="text-orange-600 text-sm mt-1">{record.garage}</div>
        </div>
        <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100"><h5 className="font-bold text-slate-700 mb-1">อาการ/รายการ</h5><p className="text-sm text-slate-600">{record.description}</p></div>
        {record.photo && <div onClick={() => onImageClick(record.photo!)} className="col-span-2 h-48 bg-slate-100 rounded-2xl overflow-hidden cursor-pointer relative group"><img src={record.photo} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-white/90 text-xs px-2 py-1 rounded-full font-bold">ดูรูป</span></div></div>}
    </div>
);
