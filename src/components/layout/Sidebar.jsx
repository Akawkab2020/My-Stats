import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, MapPin, Hospital, FileText,
  Syringe, Pill, Scale, BarChart3, ChevronDown, ChevronLeft,
  PanelRightClose, PanelRightOpen, Layers, Settings2, Users,
  ClipboardList, ShoppingCart, TrendingUp, PieChart, Landmark
} from 'lucide-react';

const menuGroups = [
  {
    title: 'الرئيسية',
    items: [
      { to: '/', label: 'لوحة المعلومات', icon: LayoutDashboard },
    ],
  },
  {
    title: 'البيانات الأساسية',
    items: [
      { to: '/master-data/hierarchy/branches', label: 'الفروع', icon: Building2 },
      { to: '/master-data/hierarchy/areas', label: 'المناطق', icon: MapPin },
      { to: '/master-data/hierarchy/clinics', label: 'العيادات', icon: Hospital },
      { to: '/master-data/drugs', label: 'إدارة الأدوية', icon: Pill },
      { to: '/master-data/insulin', label: 'إدارة الإنسولين', icon: Syringe },
      { to: '/master-data/supplies', label: 'إدارة المستلزمات', icon: Layers },
      { to: '/master-data/judicial-setup', label: 'إدارة أحكام المحكمة', icon: Scale },
    ],
  },
  {
    title: 'العمليات اليومية',
    items: [
      { to: '/transactions/monthly-totals', label: 'المنصرف الشهري (إجمالي)', icon: FileText },
      { to: '/transactions/drug-dispensing', label: 'صرف الأدوية (تفصيلي)', icon: ShoppingCart },
      { to: '/transactions/medical-tickets', label: 'التذاكر الطبية', icon: ClipboardList },
      { to: '/transactions/insulin-dispensing', label: 'صرف الإنسولين', icon: Syringe },
      { to: '/transactions/judicial-dispensing', label: 'أحكام المحكمة', icon: Landmark }, 
    ],
  },
  {
    title: 'التقارير',
    items: [
      { to: '/reports/analytical', label: 'تقارير تحليلية', icon: BarChart3 },
      { to: '/reports/financial', label: 'تقارير مالية', icon: TrendingUp },
      { to: '/reports/comparison', label: 'تقارير مقارنة', icon: PieChart },
    ],
  },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const [openGroups, setOpenGroups] = useState(() => {
    const map = {};
    menuGroups.forEach(g => { map[g.title] = true; });
    return map;
  });

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const linkClass = ({ isActive }) => `
    flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 text-sm font-bold
    ${isActive
      ? 'text-white'
      : 'hover:bg-[var(--color-border)] hover:text-[var(--color-primary)]'
    }
  `;

  const linkStyle = (isActive) => isActive
    ? { 
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', 
        boxShadow: '0 8px 20px rgba(8,145,178,0.25)',
        transform: 'scale(1.02)'
      }
    : { color: 'var(--color-text-muted)' };

  return (
    <aside
      className="fixed top-0 right-0 h-full z-40 transition-all duration-300 flex flex-col border-l"
      style={{
        width: collapsed ? '80px' : '280px',
        background: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
      }}
      dir="rtl"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', 
            boxShadow: '0 8px 16px rgba(8,145,178,0.3)' 
          }}
        >
          <Pill size={24} color="white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight" style={{ color: 'var(--color-text)' }}>إحصائيات الأدوية</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Premium System</span>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6 custom-scrollbar">
        {menuGroups.map(group => (
          <div key={group.title} className="space-y-2">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className="flex items-center justify-between w-full px-2 py-1 text-sm font-black tracking-wide cursor-pointer group"
                style={{ color: 'var(--color-primary)' }}
              >
                <span className="opacity-80 group-hover:opacity-100 transition-opacity uppercase">{group.title}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${openGroups[group.title] ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(collapsed || openGroups[group.title]) && (
              <div className="space-y-1.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={linkClass}
                    style={({ isActive }) => linkStyle(isActive)}
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        {!collapsed && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-4 mt-auto">
        <button
          onClick={onToggle}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-inner"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}
        >
          {collapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
          {!collapsed && <span className="text-xs font-black uppercase tracking-widest">طي القائمة</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
