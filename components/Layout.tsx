
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminService } from '../services/storage';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, currentView, onNavigate }) => {
  const [logo, setLogo] = useState<string>('');

  useEffect(() => {
      setLogo(adminService.getSchoolLogo());
  }, []);

  return (
    <div className="min-h-screen bg-school-50 font-sans pb-24 md:pb-0">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-school-500 to-school-700 text-white shadow-lg shadow-school-500/20 sticky top-0 z-40 rounded-b-[2rem] md:rounded-none border-b-4 border-accent-400">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
            <div className="bg-white p-1.5 rounded-2xl shadow-inner transform group-hover:rotate-12 transition-transform duration-300 border-2 border-white flex items-center justify-center w-14 h-14 overflow-hidden">
               {/* School Logo */}
               {logo ? (
                   <img 
                    src={logo} 
                    alt="Logo" 
                    className="w-10 h-10 object-contain" 
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerText = '🏫';
                        (e.target as HTMLImageElement).parentElement!.classList.add('text-2xl');
                    }}
                   />
               ) : (
                   <span className="text-3xl">🏫</span>
               )}
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none tracking-tight">ระบบยานพาหนะ</h1>
              <p className="text-xs text-school-100 font-medium mt-0.5 bg-school-800/30 px-2 py-0.5 rounded-full inline-block">โรงเรียนบ้านป่าเสร้า</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-school-800/30 pl-1 pr-3 py-1 rounded-full border border-school-400/30 backdrop-blur-sm">
                  {user.photo ? (
                      <img src={user.photo} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                      <div className="w-8 h-8 rounded-full bg-white text-school-600 flex items-center justify-center border-2 border-white shadow-sm">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                  )}
                  <span className="hidden md:inline text-sm font-medium ml-2 truncate max-w-[100px]">{user.fullName.split(' ')[0]}</span>
              </div>
              <button 
                onClick={onLogout}
                className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
                title="ออกจากระบบ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Mobile Bottom Nav - Floating Style */}
      {user && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-white/90 backdrop-blur-md rounded-full shadow-xl shadow-school-900/10 border border-white p-2 flex justify-around items-center">
            <NavIcon 
              active={currentView === 'dashboard'} 
              onClick={() => onNavigate('dashboard')} 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
              label="หน้าหลัก"
            />
            <div className="-mt-8">
               <button 
                  onClick={() => onNavigate('form')}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-accent-400/40 transform transition-transform active:scale-95 ${currentView === 'form' ? 'bg-accent-500 scale-110 ring-4 ring-white' : 'bg-accent-400 hover:bg-accent-500'}`}
               >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
               </button>
            </div>
            <NavIcon 
              active={currentView === 'reports'} 
              onClick={() => onNavigate('reports')} 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              label="ประวัติ"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const NavIcon: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center p-2 w-16 rounded-2xl transition-all ${active ? 'text-school-600 bg-school-50' : 'text-slate-400 hover:text-school-500'}`}
  >
    {icon}
    <span className="text-[10px] mt-1 font-semibold">{label}</span>
  </button>
);
