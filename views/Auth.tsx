
import React, { useState, useEffect } from 'react';
import { authService, adminService } from '../services/storage';
import { Button, Card, Input } from '../components/UI';
import { PhotoUpload } from '../components/PhotoUpload';

interface AuthProps {
  onLogin: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToReports: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onNavigateToAdmin, onNavigateToReports }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [logo, setLogo] = useState<string>('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    confirmPassword: '',
    photo: null as string | null
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('bps_remember_user');
    const savedPass = localStorage.getItem('bps_remember_pass');
    if (savedUser && savedPass) {
      setFormData(prev => ({ ...prev, username: savedUser, password: savedPass }));
      setRememberMe(true);
    }
    
    // Load logo from storage
    setLogo(adminService.getSchoolLogo());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateInput = () => {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(formData.username)) {
      throw new Error('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษและตัวเลขเท่านั้น');
    }
    const passwordRegex = /^\d{6}$/;
    if (!passwordRegex.test(formData.password)) {
      throw new Error('รหัสผ่านต้องเป็นตัวเลข 6 หลักเท่านั้น');
    }
    if (isRegistering) {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('รหัสผ่านยืนยันไม่ตรงกัน');
      }
      if (!formData.fullName) {
        throw new Error('กรุณากรอกชื่อ-นามสกุล');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      validateInput();
      if (isRegistering) {
        await authService.register({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          photo: formData.photo
        });
        await authService.login(formData.username, formData.password);
      } else {
        await authService.login(formData.username, formData.password);
      }

      if (rememberMe) {
        localStorage.setItem('bps_remember_user', formData.username);
        localStorage.setItem('bps_remember_pass', formData.password);
      } else {
        localStorage.removeItem('bps_remember_user');
        localStorage.removeItem('bps_remember_pass');
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-school-50 px-4 py-10 relative overflow-hidden">
        {/* Cute Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-accent-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-school-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10 w-full max-w-md">
            <div className="mb-8 text-center animate-fade-in">
                <div className="relative inline-block group">
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-school-200 border-4 border-white relative z-10 transform group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                        {logo ? (
                            <img 
                                src={logo} 
                                alt="School Logo" 
                                className="w-24 h-24 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-6xl">🏫</span>';
                                }} 
                            />
                        ) : (
                            <span className="text-6xl">🏫</span>
                        )}
                    </div>
                    {/* The Bus Emoji peeking out */}
                    <div className="absolute -right-4 -bottom-2 text-5xl transform rotate-12 animate-bounce-sm z-20 filter drop-shadow-lg">
                        🚌
                    </div>
                </div>
                <h1 className="text-3xl font-extrabold text-school-900 mb-1 tracking-tight">โรงเรียนบ้านป่าเสร้า</h1>
                <p className="text-school-600 font-medium bg-school-100/50 inline-block px-4 py-1 rounded-full">ระบบบันทึกการใช้ยานพาหนะ</p>
            </div>

            <Card className="shadow-xl shadow-school-500/10 border-t-4 border-school-400" title={isRegistering ? "✨ สมัครสมาชิกใหม่" : "🔑 เข้าสู่ระบบ (สำหรับครู/บุคลากร)"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-center font-medium">
                     <span className="text-xl mr-2">⚠️</span> {error}
                    </div>
                )}

                <Input 
                    label="ชื่อผู้ใช้ (Username)"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="ภาษาอังกฤษและตัวเลขเท่านั้น"
                    required
                    autoComplete="username"
                />

                {isRegistering && (
                    <>
                    <Input 
                        label="ชื่อ-นามสกุล"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="นายใจดี รักโรงเรียน"
                        required
                    />
                    <div className="mb-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <PhotoUpload 
                            label="รูปประจำตัว (ไม่บังคับ)"
                            value={formData.photo}
                            onChange={(v) => setFormData({...formData, photo: v})}
                        />
                    </div>
                    </>
                )}

                <div className="relative">
                    <Input 
                    label="รหัสผ่าน (ตัวเลข 6 หลัก)"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                        if (e.target.value === '' || /^\d+$/.test(e.target.value)) handleChange(e);
                    }}
                    maxLength={6}
                    inputMode="numeric"
                    required
                    autoComplete="current-password"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-[2.2rem] right-4 text-slate-400 hover:text-school-500 transition-colors"
                    tabIndex={-1}
                    >
                    {showPassword ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                    </button>
                </div>

                {isRegistering && (
                    <div className="relative">
                        <Input 
                        label="ยืนยันรหัสผ่าน"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                            if (e.target.value === '' || /^\d+$/.test(e.target.value)) handleChange(e);
                        }}
                        maxLength={6}
                        inputMode="numeric"
                        required
                        />
                        <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-[2.2rem] right-4 text-slate-400 hover:text-school-500 transition-colors"
                        tabIndex={-1}
                        >
                        {showConfirmPassword ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                        </button>
                    </div>
                )}

                {!isRegistering && (
                    <div className="flex items-center mb-4 bg-slate-50 p-3 rounded-xl">
                        <input 
                            id="remember-me" 
                            type="checkbox" 
                            className="w-5 h-5 text-school-500 border-gray-300 rounded focus:ring-school-400"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600">
                            จดจำฉันไว้ในเครื่องนี้
                        </label>
                    </div>
                )}

                <div className="pt-2">
                    <Button type="submit" className="w-full text-lg py-3 shadow-xl shadow-school-500/30" isLoading={loading}>
                    {isRegistering ? "🚀 ลงทะเบียนสมาชิก" : "✨ เข้าใช้งานระบบ"}
                    </Button>
                </div>

                <div className="text-center text-sm mt-6">
                    <button 
                    type="button"
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                        setFormData({ username: '', password: '', fullName: '', confirmPassword: '', photo: null });
                    }}
                    className="text-slate-500 hover:text-school-600 font-bold hover:underline transition-colors"
                    >
                    {isRegistering ? "← มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิกใหม่ →"}
                    </button>
                </div>
                </form>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4 mt-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
                <button 
                    onClick={onNavigateToReports}
                    className="bg-white p-4 rounded-2xl shadow-md border-2 border-transparent hover:border-school-300 hover:shadow-xl transition-all group text-left"
                >
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <span className="block font-bold text-slate-700">ประวัติการใช้</span>
                    <span className="text-xs text-slate-400">ดูข้อมูลสาธารณะ</span>
                </button>

                <button 
                    onClick={onNavigateToAdmin}
                    className="bg-white p-4 rounded-2xl shadow-md border-2 border-transparent hover:border-red-300 hover:shadow-xl transition-all group text-left"
                >
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="block font-bold text-slate-700">ผู้ดูแลระบบ</span>
                    <span className="text-xs text-slate-400">จัดการหลังบ้าน</span>
                </button>
            </div>
        </div>
    </div>
  );
};
