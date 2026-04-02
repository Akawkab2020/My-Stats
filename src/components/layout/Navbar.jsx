import React, { useState } from 'react';
import { 
  Sun, Moon, User, Info, BookOpen, 
  Settings, Building2, MapPin, Hospital, ChevronDown
} from 'lucide-react';
import { useGlobalApp } from '../../context/GlobalAppContext';

const Navbar = () => {
  const { theme, toggleTheme, workspaceMode, setWorkspaceMode, lockedLevel } = useGlobalApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const workspaceOptions = [
    { value: 'branches', level: 'branch', label: 'تجميعي فروع', icon: Building2 },
    { value: 'areas', level: 'area', label: 'تجميعي مناطق', icon: MapPin },
    { value: 'clinics', level: 'clinic', label: 'تفصيلي عيادات', icon: Hospital },
  ];

  const currentMode = workspaceOptions.find(opt => opt.value === workspaceMode);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 transition-all duration-300"
      style={{
        background: 'var(--color-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
      dir="rtl"
    >
      {/* Right: Workspace Switcher */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center p-1 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-sm">
          {workspaceOptions.map((opt) => {
            const isDisabled = lockedLevel && lockedLevel !== opt.level;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => !isDisabled && setWorkspaceMode(opt.value)}
                disabled={isDisabled}
                title={isDisabled ? `هذا الشهر مقفل على مستوى ${lockedLevel === 'branch' ? 'الفرع' : lockedLevel === 'area' ? 'المنطقة' : 'العيادة'}` : ''}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  workspaceMode === opt.value 
                    ? 'bg-[var(--color-primary)] text-white shadow-md' 
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-primary)]'
                } ${isDisabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
              >
                <Icon size={14} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        {/* Mobile View / Compact */}
        <div className="md:hidden">
           {currentMode && (
             <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold shadow-md">
               {React.createElement(currentMode.icon, { size: 14 })}
               <span>{currentMode.label}</span>
             </button>
           )}
        </div>
      </div>

      {/* Left: Actions & Profiles */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* User Manual */}
        <button 
          className="p-2.5 rounded-xl hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-all cursor-pointer"
          title="دليل المستخدم"
        >
          <BookOpen size={18} />
        </button>

        {/* Designer Info */}
        <button 
          className="p-2.5 rounded-xl hover:bg-[var(--color-border)] text-[var(--color-text-muted)] transition-all cursor-pointer"
          title="عن المصمم"
          onClick={() => alert('نظام إحصائيات الأدوية v2.0\nتصميم وإعداد: ك/ أحمد علي أحمد كوكب\n01000314398')}
        >
          <Info size={18} />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-primary)] shadow-sm hover:shadow-md transition-all cursor-pointer"
          title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="w-[1px] h-8 bg-[var(--color-border)] mx-1 opacity-50"></div>

        {/* User Profile */}
        <button className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-[var(--color-border)] transition-all cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-sm ring-2 ring-transparent group-hover:ring-[var(--color-primary-light)] transition-all">
            <User size={18} />
          </div>
          <div className="hidden lg:block text-right">
             <p className="text-[11px] font-black text-[var(--color-text)]">د/ المشرف العام</p>
             <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-tighter">Administrator</p>
          </div>
          <ChevronDown size={12} className="text-[var(--color-text-muted)] mr-1" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
