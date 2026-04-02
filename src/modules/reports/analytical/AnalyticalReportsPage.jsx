import React, { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import HierarchySelector from '../../../components/common/HierarchySelector';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import invoke from '../../../api/tauriApi';
import { BarChart3, Search, FileDown, Printer } from 'lucide-react';

const AnalyticalReportsPage = () => {
  const toast = useToast();
  const [hierarchy, setHierarchy] = useState({
    branchId: '', areaId: '', clinicId: '',
    dispenseMonth: new Date().toISOString().substring(0, 7)
  });
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!hierarchy.branchId) {
      toast.warning('يرجى اختيار الفرع على الأقل');
      return;
    }
    setLoading(true);
    try {
      // Mock report generation
      setTimeout(() => {
        setData([
          { id: 1, name: 'منصرف الأدوية', count: 150, value: '4500.50' },
          { id: 2, name: 'منصرف الإنسولين', count: 45, value: '12000.00' },
          { id: 3, name: 'المستلزمات الطبية', count: '-', value: '850.25' },
          { id: 4, name: 'تذاكر 56ب', count: 230, value: '-' },
          { id: 5, name: 'صرف قضائي', count: 12, value: '3100.00' },
        ]);
        setLoading(false);
        toast.success('تم توليد التقرير بنجاح');
      }, 800);
    } catch (err) {
      toast.error('فشل في توليد التقرير');
      setLoading(false);
    }
  };

  const columns = [
    { header: 'البيان', accessor: 'name' },
    { header: 'العدد / الحالات', accessor: 'count' },
    { header: 'القيمة الإجمالية', accessor: (row) => row.value !== '-' ? `${row.value} ج.م` : '-' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'التقارير' }, { label: 'تقارير تحليلية' }]} />
      
      <PageHeader 
        title="التقارير التحليلية" 
        icon={BarChart3} 
        description="استعراض تحليلي للمنصرف والعمليات حسب الفروع والعيادات."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" icon={Printer}>طباعة</Button>
            <Button variant="ghost" icon={FileDown}>تصدير Excel</Button>
          </div>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full">
            <HierarchySelector 
              onChange={(d) => setHierarchy({ ...hierarchy, ...d })}
              onMonthChange={(m) => setHierarchy({ ...hierarchy, dispenseMonth: m })}
              selectedMonth={hierarchy.dispenseMonth}
            />
          </div>
          <Button 
            variant="primary" 
            icon={Search} 
            onClick={handleGenerate}
            loading={loading}
            className="h-12 px-8 mb-1"
          >
            عرض التقرير
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table 
          columns={columns} 
          data={data} 
          loading={loading}
          actions={false}
        />
        {data.length === 0 && !loading && (
          <div className="p-20 text-center text-cyan-500 italic">
            يرجى اختيار الفلاتر والضغط على "عرض التقرير" لاستعراض البيانات.
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnalyticalReportsPage;
