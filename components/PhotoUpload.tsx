import React, { useRef, useState } from 'react';
import { Button } from './UI';

interface PhotoUploadProps {
  label: string;
  value: string | null;
  onChange: (base64: string | null) => void;
  required?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ label, value, onChange, required }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!value ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-school-400 transition-colors min-h-[150px]"
        >
          {loading ? (
             <span className="text-slate-500 text-sm">กำลังโหลดภาพ...</span>
          ) : (
            <>
              <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-slate-500 text-sm">แตะเพื่อถ่ายภาพ/เลือกภาพ</span>
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-slate-200">
          <img src={value} alt="Preview" className="w-full h-48 object-cover" />
          <button 
            onClick={clearImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
            title="ลบภาพ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <input 
        ref={inputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        onChange={handleFileChange} 
        className="hidden"
      />
    </div>
  );
};