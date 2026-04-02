import React, { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import HierarchySelector from '../../../components/common/HierarchySelector';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import { TrendingUp, FileDown, Printer, Calculator } from 'lucide-react';

const FinancialReportsPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleFetch = () => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { item: 'إجمالي المبالغ المحصلة (حصة المريض)', value: '1,250.00' },
        { item: 'إجمالي تكلفة المجموعات الدوائية', value: '15,400.00' },
        { item: 'إجمالي قيمة المنصرف المجاني', value: '8,200.00' },
        { item: 'إجمالي قيمة المنصرف المدعم (مشاركة الهيئة)', value: '12,100.00' },
        { item: 'إجمالي قيمة المستلزمات الطبية', value: '945.50' },
      ]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'التقارير' }, { label: 'تقارير مالية' }]} />
      
      <PageHeader 
        title="التقارير المالية" 
        icon={TrendingUp} 
        description="متابعة التكاليف الإجمالية، المبالغ المحصلة، والقيم المالية للمنصرف."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" icon={Printer}>طباعة</Button>
            <Button variant="ghost" icon={FileDown}>تصدير PDF</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 p-6 space-y-4">
          <h3 className="font-bold text-cyan-900 border-b pb-2 mb-4 flex items-center gap-2">
            <Calculator size={18} /> فلاتر البحث
          </h3>
          <HierarchySelector 
            compact
            onChange={() => {}}
          />
          <Button variant="primary" className="w-full" onClick={handleFetch} loading={loading}>عرض البيانات</Button>
        </Card>

        <Card className="lg:col-span-3 p-0 overflow-hidden">
          <Table 
            columns={[
              { header: 'البند المالي', accessor: 'item' },
              { header: 'القيمة', accessor: (row) => <span className="font-black text-cyan-700">{row.value} ج.م</span> }
            ]}
            data={data}
            loading={loading}
            actions={false}
          />
          {data.length === 0 && !loading && (
            <div className="p-20 text-center text-cyan-500 italic">حدد المعايير لعرض التقرير المالي.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FinancialReportsPage;
