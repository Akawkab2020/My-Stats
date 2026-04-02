import React, { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { PieChart, GitCompare, ArrowRightLeft } from 'lucide-react';

const ComparisonReportsPage = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'التقارير' }, { label: 'تقارير مقارنة' }]} />
      
      <PageHeader 
        title="تقارير المقارنة" 
        icon={PieChart} 
        description="مقارنة أداء العيادات أو الفترات الزمنية المختلفة (قريباً)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 border-dashed border-2 flex flex-col items-center text-center space-y-4 bg-transparent shadow-none">
          <div className="w-16 h-16 rounded-full bg-cyan-100/50 flex items-center justify-center text-cyan-500">
            <ArrowRightLeft size={32} />
          </div>
          <h3 className="text-lg font-bold text-cyan-900">مقارنة بين عيادتين</h3>
          <p className="text-cyan-600 text-sm">مقارنة المنصرف الشهري والعدد الإجمالي بين عيادة وأخرى في نفس المنطقة.</p>
          <Button variant="ghost" disabled>تفعيل الميزة</Button>
        </Card>

        <Card className="p-8 border-dashed border-2 flex flex-col items-center text-center space-y-4 bg-transparent shadow-none">
          <div className="w-16 h-16 rounded-full bg-cyan-100/50 flex items-center justify-center text-cyan-500">
            <GitCompare size={32} />
          </div>
          <h3 className="text-lg font-bold text-cyan-900">مقارنة فترات زمنية</h3>
          <p className="text-cyan-600 text-sm">مقارنة النمو في المنصرف بين شهر وآخر لنفس العيادة أو المنطقة.</p>
          <Button variant="ghost" disabled>تفعيل الميزة</Button>
        </Card>
      </div>

      <Card className="p-10 flex flex-col items-center justify-center text-center space-y-4">
         <p className="text-cyan-700 font-semibold italic">سيتم ربط المخططات البيانية (Charts) في هذه الصفحة لاحقاً لتقديم رؤية بصرية أفضل.</p>
      </Card>
    </div>
  );
};

export default ComparisonReportsPage;
