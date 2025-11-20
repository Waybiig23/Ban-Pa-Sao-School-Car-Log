import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'yellow';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', isLoading, className = '', ...props 
}) => {
  const baseStyles = "px-6 py-2.5 rounded-full font-bold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 shadow-md hover:shadow-lg";
  
  const variants = {
    primary: "bg-gradient-to-r from-school-500 to-school-600 hover:from-school-400 hover:to-school-500 text-white border-2 border-transparent",
    secondary: "bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-2 border-transparent",
    outline: "bg-white border-2 border-school-500 text-school-600 hover:bg-school-50",
    yellow: "bg-gradient-to-r from-accent-400 to-accent-500 hover:from-yellow-300 hover:to-accent-400 text-white border-2 border-transparent text-school-900"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">{label}</label>
    <input 
      className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-2xl focus:ring-4 focus:ring-school-100 focus:border-school-400 outline-none transition-all ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-school-300'} ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-slate-600 mb-1.5 ml-1">{label}</label>
    <div className="relative">
      <select 
        className={`w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-school-100 focus:border-school-400 outline-none appearance-none transition-all hover:border-school-300 ${className}`}
        {...props}
      >
        <option value="">-- กรุณาเลือก --</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, title?: string, className?: string, icon?: React.ReactNode }> = ({ children, title, className = '', icon }) => (
  <div className={`bg-white rounded-3xl shadow-lg shadow-blue-900/5 overflow-hidden border border-slate-100 ${className}`}>
    {title && (
      <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100 flex items-center">
        {icon && <span className="mr-2 text-xl">{icon}</span>}
        <h3 className="font-bold text-lg text-school-800">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-school-900/40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in border-4 border-white ring-1 ring-slate-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
          <h3 className="text-xl font-bold text-school-800 flex items-center">
            <span className="w-2 h-6 bg-accent-400 rounded-full mr-3"></span>
            {title}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};