
import React, { useState, useEffect } from 'react';
import { User, Car, ADMIN_PIN, AppRecord, RecordType, TravelRecord, FuelRecord, MaintenanceRecord } from '../types';
import { carService, adminService, dataService } from '../services/storage';
import { Button, Card, Input, Modal } from '../components/UI';
import { PhotoUpload } from '../components/PhotoUpload';

interface AdminPanelProps {
    onBack: () => void;
    currentUser?: User | null;
    onEditRecord: (record: AppRecord) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, currentUser, onEditRecord }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('bps_admin_session') === 'true');
    const [pinInput, setPinInput] = useState('');
    const [activeTab, setActiveTab] = useState<'CARS' | 'USERS' | 'RECORDS' | 'SETTINGS'>('RECORDS');
    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [records, setRecords] = useState<AppRecord[]>([]);
    const [logo, setLogo] = useState<string | null>(null);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [viewRecord, setViewRecord] = useState<AppRecord | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'RECORD' | 'CAR' | 'USER' | null; id: string | null; }>({ isOpen: false, type: null, id: null });

    useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recData, carData, userData] = await Promise.all([dataService.getRecords(), carService.getCars(), adminService.getAllUsers()]);
            setRecords(recData); setCars(carData); setUsers(userData);
            setLogo(adminService.getSchoolLogo());
        } catch (e) { console.error("Failed to load data", e); } finally { setLoading(false); }
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput === ADMIN_PIN) { setIsAuthenticated(true); sessionStorage.setItem('bps_admin_session', 'true'); }
        else { alert('รหัส PIN ไม่ถูกต้อง'); setPinInput(''); }
    };

    const confirmDelete = async () => {
        if (!deleteModal.id || !deleteModal.type) return;
        setLoading(true);
        try {
            if (deleteModal.type === 'RECORD') { setRecords(prev => prev.filter(r => r.id !== deleteModal.id)); if (viewRecord?.id === deleteModal.id) setViewRecord(null); await dataService.deleteRecord(deleteModal.id!); }
            else if (deleteModal.type === 'CAR') { setCars(prev => prev.filter(c => c.id !== deleteModal.id)); await carService.deleteCar(deleteModal.id!); }
            else if (deleteModal.type === 'USER') { setUsers(prev => prev.filter(u => u.id !== deleteModal.id)); await adminService.deleteUser(deleteModal.id!); }
            alert('ลบข้อมูลเรียบร้อยแล้ว');
        } catch (error) { alert('เกิดข้อผิดพลาดในการลบข้อมูล'); loadData(); } finally { setLoading(false); setDeleteModal({ isOpen: false, type: null, id: null }); }
    };

    const handleSaveModal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (activeTab === 'CARS') {
                if (!formData.name) throw new Error("กรุณากรอกชื่อรถ");
                if (editingItem) await carService.updateCar({ ...editingItem, name: formData.name, photo: formData.photo });
                else await carService.addCar({ name: formData.name, photo: formData.photo });
            } else if (activeTab === 'USERS') {
                if (!/^[a-zA-Z0-9]+$/.test(formData.username)) throw new Error('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษและตัวเลขเท่านั้น');
                if (!editingItem && !formData.password) throw new Error("กรุณาตั้งรหัสผ่าน");
                if (editingItem) await adminService.updateUser({ ...editingItem, username: formData.username, fullName: formData.fullName, photo: formData.photo, ...(formData.password ? { password: formData.password } : {}) });
                else await adminService.createUser({ username: formData.username, fullName: formData.fullName, password: formData.password, photo: formData.photo });
            }
            setModalOpen(false); await loadData(); alert('บันทึกเรียบร้อยแล้ว');
        } catch (err: any) { alert(err.message || 'เกิดข้อผิดพลาด'); } finally { setLoading(false); }
    };

    const handleSaveSettings = async () => {
        try {
            if (logo) {
                adminService.setSchoolLogo(logo);
                alert('บันทึกโลโก้เรียบร้อยแล้ว ระบบจะรีเฟรชเพื่อแสดงผลการเปลี่ยนแปลง');
                window.location.reload();
            }
        } catch (e) {
            alert('เกิดข้อผิดพลาดในการบันทึกโลโก้ (ไฟล์อาจมีขนาดใหญ่เกินไป)');
        }
    };

    const openEditModal = (e: React.MouseEvent, item: any | null) => { e.preventDefault(); e.stopPropagation(); setEditingItem(item); setFormData(item ? (activeTab === 'CARS' ? { name: item.name, photo: item.photo } : { username: item.username, fullName: item.fullName, photo: item.photo }) : {}); setModalOpen(true); };

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in px-4">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-red-100 border-4 border-white"><svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                <Card className="w-full max-w-sm p-8 text-center shadow-2xl border-t-4 border-red-500">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">ระบบผู้ดูแล (Admin)</h2>
                    <p className="text-slate-500 mb-6 text-sm">พื้นที่สำหรับเจ้าหน้าที่ดูแลระบบเท่านั้น</p>
                    <form onSubmit={handlePinSubmit}>
                        <input type="password" className="text-center text-4xl tracking-[0.5em] w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-6 focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none font-bold text-slate-700" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus placeholder="••••••" />
                        <Button type="submit" variant="danger" className="w-full py-3 text-lg shadow-lg shadow-red-500/30">เข้าสู่ระบบ</Button>
                        <button type="button" onClick={onBack} className="mt-4 text-slate-400 hover:text-slate-600 text-sm font-medium">← กลับหน้าหลัก</button>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center">
                     <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 mr-3 border border-red-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                     <div><h2 className="text-lg font-bold text-slate-800">ระบบจัดการหลังบ้าน</h2><p className="text-xs text-slate-400 font-medium">ADMIN PANEL</p></div>
                </div>
                <Button variant="secondary" onClick={() => { sessionStorage.removeItem('bps_admin_session'); setIsAuthenticated(false); onBack(); }} className="text-xs px-3 py-1.5 rounded-full">ออก</Button>
            </div>

            <div className="flex p-1 bg-slate-200/50 rounded-full mb-6 overflow-x-auto">
                {['RECORDS', 'CARS', 'USERS', 'SETTINGS'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2.5 px-4 whitespace-nowrap rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-school-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab === 'RECORDS' ? '📝 บันทึก' : tab === 'CARS' ? '🚗 รถยนต์' : tab === 'USERS' ? '👥 ผู้ใช้' : '⚙️ ตั้งค่า'}
                    </button>
                ))}
            </div>

            {activeTab === 'RECORDS' && (
                <div className="space-y-4">
                    {records.map(r => (
                        <div key={r.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${r.type === 'TRAVEL' ? 'bg-blue-50 text-blue-500' : r.type === 'FUEL' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>{r.type}</span>
                                <h3 className="font-bold text-slate-700 mt-1 line-clamp-1">{r.type === 'TRAVEL' ? (r as TravelRecord).locationTo : r.type === 'MAINTENANCE' ? (r as MaintenanceRecord).description : 'เติมน้ำมัน'}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{r.date} • {r.driverName}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={(e) => { e.stopPropagation(); setViewRecord(r); }} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-school-50 hover:text-school-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                <button onClick={(e) => { e.stopPropagation(); onEditRecord(r); }} className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'RECORD', id: r.id }); }} className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {(activeTab === 'CARS' || activeTab === 'USERS') && (
                <div className="space-y-4">
                    <Button onClick={(e) => openEditModal(e, null)} variant="yellow" className="w-full shadow-md mb-4">
                        <span className="mr-2 text-xl">+</span> เพิ่มข้อมูลใหม่
                    </Button>
                    {(activeTab === 'CARS' ? cars : users).map((item: any) => (
                        <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <div className="flex items-center">
                                {item.photo ? <img src={item.photo} className="w-10 h-10 rounded-full object-cover mr-3 border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-full mr-3 flex items-center justify-center text-lg">{activeTab === 'CARS' ? '🚌' : '👤'}</div>}
                                <div>
                                    <div className="font-bold text-slate-700">{item.name || item.fullName}</div>
                                    {activeTab === 'USERS' && <div className="text-xs text-slate-400">@{item.username}</div>}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={(e) => openEditModal(e, item)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold">แก้ไข</button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: activeTab === 'CARS' ? 'CAR' : 'USER', id: item.id }); }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold">ลบ</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'SETTINGS' && (
                <Card title="ตั้งค่าระบบ" icon="⚙️">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-700 mb-2">โลโก้โรงเรียน</h4>
                            <p className="text-sm text-slate-500 mb-4">อัปโหลดรูปตราสัญลักษณ์โรงเรียนเพื่อแสดงในหน้าเข้าสู่ระบบและส่วนหัวของเว็บ (แนะนำไฟล์ภาพพื้นหลังโปร่งใส PNG ขนาดไม่เกิน 1MB)</p>
                            <PhotoUpload 
                                label="เลือกรูปโลโก้" 
                                value={logo} 
                                onChange={(v) => setLogo(v)} 
                            />
                        </div>
                        <Button onClick={handleSaveSettings} className="w-full shadow-lg">บันทึกการตั้งค่า</Button>
                    </div>
                </Card>
            )}

            {/* DELETE MODAL */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, type: null, id: null })} title="ลบข้อมูล">
                <div className="text-center p-2">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🗑️</div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">ยืนยันการลบ?</h3>
                    <p className="text-slate-500 text-sm mb-6">ข้อมูลจะหายไปถาวร ไม่สามารถกู้คืนได้</p>
                    <div className="flex space-x-3">
                        <Button variant="secondary" className="flex-1 rounded-2xl" onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}>ยกเลิก</Button>
                        <Button variant="danger" className="flex-1 rounded-2xl shadow-lg shadow-red-500/30" onClick={confirmDelete} isLoading={loading}>ลบทันที</Button>
                    </div>
                </div>
            </Modal>

            {/* EDIT MODAL */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}>
                <form onSubmit={handleSaveModal} className="space-y-4">
                    {activeTab === 'CARS' ? (
                        <>
                            <Input label="ชื่อรถ / ทะเบียน" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <PhotoUpload label="รูปรถ" value={formData.photo} onChange={(v) => setFormData({...formData, photo: v})} />
                        </>
                    ) : (
                        <>
                            <Input label="Username" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} required />
                            <Input label="ชื่อ-สกุล" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                            <Input label="รหัสผ่าน (ตัวเลข 6 หลัก)" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingItem ? "เว้นว่างหากไม่เปลี่ยน" : ""} maxLength={6} required={!editingItem} />
                            <PhotoUpload label="รูปโปรไฟล์" value={formData.photo} onChange={(v) => setFormData({...formData, photo: v})} />
                        </>
                    )}
                    <div className="flex space-x-3 pt-2">
                        <Button type="button" variant="secondary" className="flex-1 rounded-2xl" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit" className="flex-1 rounded-2xl" isLoading={loading}>บันทึก</Button>
                    </div>
                </form>
            </Modal>

            {/* VIEW RECORD MODAL */}
            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="รายละเอียด">
                {viewRecord && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                            <div><span className="text-xs text-slate-400 uppercase block">วันที่</span><span className="font-bold text-slate-700">{viewRecord.date}</span></div>
                            <div className="text-right"><span className="text-xs text-slate-400 uppercase block">เวลา</span><span className="font-bold text-slate-700">{viewRecord.time}</span></div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center mb-3"><div className="w-8 h-8 bg-slate-100 rounded-full mr-3 flex items-center justify-center">👤</div><span className="font-bold text-slate-700">{viewRecord.driverName}</span></div>
                            <div className="flex items-center"><div className="w-8 h-8 bg-school-50 text-school-500 rounded-full mr-3 flex items-center justify-center">🚌</div><span className="font-bold text-slate-700">{viewRecord.carId}</span></div>
                        </div>
                        {viewRecord.type === 'TRAVEL' && <div className="bg-blue-50 p-4 rounded-2xl text-blue-800 border border-blue-100"><p><strong>ไป:</strong> {(viewRecord as TravelRecord).locationTo}</p><p className="text-sm mt-1">{(viewRecord as TravelRecord).purpose}</p></div>}
                        {viewRecord.type === 'FUEL' && <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-800 border border-emerald-100 text-center"><span className="block text-3xl font-bold">{(viewRecord as FuelRecord).cost} ฿</span><span className="text-sm">{(viewRecord as FuelRecord).station}</span></div>}
                        <div className="flex space-x-3 mt-4"><Button onClick={() => onEditRecord(viewRecord)} className="flex-1 rounded-2xl">แก้ไข</Button><Button onClick={(e) => { setViewRecord(null); setDeleteModal({ isOpen: true, type: 'RECORD', id: viewRecord.id }); }} variant="danger" className="flex-1 rounded-2xl">ลบ</Button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
