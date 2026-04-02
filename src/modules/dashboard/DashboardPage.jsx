import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Syringe, ShoppingCart, Scale, 
  Users, Activity, ClipboardList, Layers, Landmark, ArrowRight,
  Building2, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/ui/Breadcrumb';
import StatCard from '../../components/dashboard/StatCard';
import DashboardChart from '../../components/dashboard/DashboardChart';
import QuickAccessClinic from '../../components/dashboard/QuickAccessClinic';
import MonthIsolationWidget from '../../components/dashboard/MonthIsolationWidget';
import Card from '../../components/ui/Card';
import invoke from '../../api/tauriApi';

const quickLinks = [
  { label: 'منصرف الأدوية (تفصيلي)', to: '/transactions/drug-dispensing', icon: ShoppingCart, color: '#8b5cf6' },
  { label: 'منصرف الأنسولين', to: '/transactions/insulin-dispensing', icon: Syringe, color: '#0ea5e9' },
  { label: 'المنصرف الشهري', to: '/transactions/monthly-totals', icon: FileText, color: '#0891b2' },
  { label: 'منصرف التذاكر الطبية', to: '/transactions/medical-tickets', icon: ClipboardList, color: '#10b981' },
  { label: 'تكلفة المجموعات الدوائية', to: '/transactions/group-costs', icon: Layers, color: '#f59e0b' },
  { label: 'منصرف الأحكام القضائية', to: '/transactions/judicial-dispensing', icon: Scale, color: '#ef4444' },
];

const DashboardPage = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dispenseMonth, setDispenseMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    invoke('get_branches').then(setBranches).catch(console.error);
  }, []);

  return (
    <div dir="rtl" className="animate-in fade-in duration-500 pb-10">
      <Breadcrumb items={[{ label: 'الرئيسية' }]} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="section-icon" style={{ background: 'white', color: 'var(--color-primary)', boxShadow: 'var(--shadow-premium)' }}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>لوحة المعلومات</h1>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>مرحباً بك مجدداً في نظام إحصائيات الأدوية</p>
          </div>
        </div>
        
        {/* Global Control Bar */}
        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 border-l pl-3 ml-1 border-slate-100">
             <Building2 size={16} className="text-slate-400" />
             <select 
               className="bg-transparent border-none outline-none text-xs font-black text-slate-700 cursor-pointer p-1"
               value={selectedBranch}
               onChange={(e) => setSelectedBranch(e.target.value)}
             >
               <option value="">-- اختر الفرع --</option>
               {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
           </div>
           <div className="flex items-center gap-2">
             <Calendar size={16} className="text-slate-400" />
             <input 
               type="month" 
               className="bg-transparent border-none outline-none text-xs font-black text-slate-700 cursor-pointer p-1"
               value={dispenseMonth}
               onChange={(e) => setDispenseMonth(e.target.value)}
             />
           </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-slate-100 mb-8"></div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          label="إجمالي المنصرف (الشهر الحالي)" 
          value="45,280.00" 
          subValue="ج.م"
          trend="up"
          trendValue="12.5%"
          icon={FileText}
          color="#0891b2"
        />
        <StatCard 
          label="العيادات النشطة" 
          value="42" 
          subValue="عيادة"
          trend="up"
          trendValue="3"
          icon={Activity}
          color="#059669"
        />
        <StatCard 
          label="تذاكر طبية مسجلة" 
          value="1,240" 
          subValue="تذكرة"
          trend="down"
          trendValue="5%"
          icon={Syringe}
          color="#f59e0b"
        />
        <StatCard 
          label="مرضى الأحكام القضائية" 
          value="156" 
          subValue="ملف"
          icon={Scale}
          color="#8b5cf6"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Local Controls (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <MonthIsolationWidget branchId={selectedBranch} dispenseMonth={dispenseMonth} />
          <QuickAccessClinic />
        </div>

        {/* Right Column: Chart (2/3) */}
        <div className="lg:col-span-2">
          <DashboardChart />
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Layers size={18} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>وصول سريع للعمليات</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to} className="no-underline group">
              <Card className="hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${link.color}15`, color: link.color }}
                    >
                      <link.icon size={20} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{link.label}</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-primary transition-colors group-hover:translate-x-[-4px]" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Row / Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex items-center gap-5 p-6 border-l-4 border-l-purple-500">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">أكثر الأدوية صرفاً</h4>
            <p className="text-sm text-slate-500 font-medium">الأنسولين يتصدر القائمة هذا الشهر بنسبة 45%</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-5 p-6 border-l-4 border-l-amber-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">معدل خدمة المرضى</h4>
            <p className="text-sm text-slate-500 font-medium">تمت خدمة 120 مريضاً في الساعة الأخيرة</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
