import React from 'react';
import { Mail, Phone, Code2, Lock, Unlock } from 'lucide-react';
import { useGlobalApp } from '../../context/GlobalAppContext';

const Footer = () => {
  const { isMasterUnlocked, setIsMasterUnlocked } = useGlobalApp();

  const handleToggleLock = () => {
    if (!isMasterUnlocked) {
      const pass = window.prompt('يرجى إدخال كلمة سر المدير لفك قفل السجلات القديمة:');
      if (pass === 'admin123') {
        setIsMasterUnlocked(true);
      } else if (pass !== null) {
        alert('كلمة السر غير صحيحة!');
      }
    } else {
      setIsMasterUnlocked(false);
    }
  };

  return (
    <footer 
      className="mt-auto py-8 px-6 border-t transition-colors duration-300"
      style={{ 
        background: 'var(--color-bg-card)', 
        borderColor: 'var(--color-border)' 
      }}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Info */}
        <div className="space-y-2 text-center md:text-right">
          <h4 className="text-lg font-black text-[var(--color-primary)]">نظام إحصائيات الأدوية والمستلزمات الطبية</h4>
          <p className="text-sm font-bold text-[var(--color-text-muted)]">الإصدار 2.0 - تجربة مستخدم متطورة</p>
        </div>

        {/* Admin Lock - Master Switch */}
        <div className="flex flex-col items-center gap-2">
            <button 
              onClick={handleToggleLock}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 font-bold text-xs ${
                isMasterUnlocked 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-lg shadow-emerald-100' 
                : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
              }`}
            >
              {isMasterUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{isMasterUnlocked ? 'نظام التعديل مفتوح' : 'نظام السجلات مؤمن'}</span>
            </button>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">خاص بالمسؤول فقط</p>
        </div>

        {/* Designer Branding */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-2 text-[var(--color-text)] font-bold">
            <Code2 size={18} className="text-[var(--color-primary)]" />
            <span>تصميم وإعداد: ك/ أحمد علي أحمد كوكب</span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-4">
            <a 
              href="tel:01000314398" 
              className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Phone size={14} />
              <span dir="ltr">01000314398</span>
            </a>
            <a 
              href="mailto:a.kawkab2020@gmail.com" 
              className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Mail size={14} />
              <span>a.kawkab2020@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-[var(--color-border)] opacity-30 text-center text-[10px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
        Built with Tauri + React + SQLite | 2024 All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
