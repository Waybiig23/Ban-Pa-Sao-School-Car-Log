import React from 'react';
import { Card } from '../components/UI';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (view: string, subTab?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-school-500 to-school-700 rounded-[2rem] p-6 text-white shadow-xl shadow-school-500/30 flex items-center space-x-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
            {user.photo ? (
                <img src={user.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-md" />
            ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/30">
                    <span className="text-4xl animate-bounce-sm">👋</span>
                </div>
            )}
        </div>
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-1 tracking-tight">สวัสดี, {user.fullName.split(' ')[0]}</h2>
            <p className="text-school-100 font-medium bg-school-800/30 px-3 py-1 rounded-full inline-block text-sm">พร้อมสำหรับการเดินทางวันนี้ไหม?</p>
        </div>
      </div>

      <div>
          <h3 className="font-bold text-slate-700 text-xl mb-4 flex items-center">
              <span className="w-2 h-8 bg-accent-400 rounded-full mr-3"></span>
              เลือกรายการบันทึก
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MenuCard 
              title="เดินทาง" 
              subtitle="ไปราชการ / รับส่ง"
              icon="🚗"
              color="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
              iconBg="bg-blue-200 text-blue-700"
              onClick={() => onNavigate('form', 'travel')}
            />
            <MenuCard 
              title="เติมน้ำมัน" 
              subtitle="บันทึกประวัติเชื้อเพลิง"
              icon="⛽"
              color="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200"
              iconBg="bg-emerald-200 text-emerald-700"
              onClick={() => onNavigate('form', 'fuel')}
            />
            <MenuCard 
              title="ซ่อมบำรุง" 
              subtitle="เช็คระยะ / อะไหล่"
              icon="🔧"
              color="bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
              iconBg="bg-orange-200 text-orange-700"
              onClick={() => onNavigate('form', 'maintenance')}
            />
          </div>
      </div>

      <div className="pt-4">
         <h3 className="font-bold text-slate-700 text-xl mb-4 flex items-center">
             <span className="w-2 h-8 bg-slate-300 rounded-full mr-3"></span>
             ข้อมูลอื่นๆ
         </h3>
         <div 
            onClick={() => onNavigate('reports')}
            className="bg-white p-5 rounded-[1.5rem] border-2 border-slate-100 shadow-lg shadow-slate-200/50 hover:border-school-300 hover:shadow-xl transition-all cursor-pointer flex items-center justify-between group"
         >
            <div className="flex items-center space-x-5">
                <div className="bg-school-50 group-hover:bg-school-500 group-hover:text-white transition-colors w-14 h-14 rounded-2xl flex items-center justify-center text-school-500 text-2xl">
                    📊
                </div>
                <div>
                    <h4 className="font-bold text-lg text-slate-700 group-hover:text-school-600 transition-colors">ประวัติการบันทึกทั้งหมด</h4>
                    <p className="text-slate-400 text-sm">ดูรายงานย้อนหลังและส่งออกข้อมูล</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-school-100 group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-school-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
         </div>
      </div>
    </div>
  );
};

const MenuCard: React.FC<{ title: string; subtitle: string; icon: string; color: string; iconBg: string; onClick: () => void }> = ({ title, subtitle, icon, color, iconBg, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-95 flex flex-col justify-between h-36 relative overflow-hidden group ${color}`}
    >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-sm ${iconBg}`}>
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-xl tracking-tight">{title}</h3>
            <p className="text-sm opacity-80 font-medium">{subtitle}</p>
        </div>
        <div className="absolute right-[-10px] top-[-10px] text-9xl opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
            {icon}
        </div>
    </button>
);