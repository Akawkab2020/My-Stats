import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import HierarchySelector from '../../../components/common/HierarchySelector';
import MonthlyDispensedForm from '../../../components/forms/MonthlyDispensedForm';
import { FileText } from 'lucide-react';

const MonthlyTotalsPage = () => {
  const location = useLocation();
  const [hierarchy, setHierarchy] = useState({
    branchId: location.state?.branchId || '',
    areaId: location.state?.areaId || '',
    clinicId: location.state?.clinicId || '',
    dispenseMonth: location.state?.dispenseMonth || new Date().toISOString().substring(0, 7)
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'العمليات اليومية' }, { label: 'المنصرف الشهري (إجمالي)' }]} />
      
      <PageHeader 
        title="إجمالي المنصرف الشهري" 
        icon={FileText} 
        description="إدخال القيم الإجمالية للمنصرف الشهري (مجاني، مدعم، مستلزمات) لكل عيادة."
      />

      <HierarchySelector 
        onSelectionChange={(data) => setHierarchy({ ...hierarchy, ...data })}
        initialBranch={hierarchy.branchId}
        initialArea={hierarchy.areaId}
        initialClinic={hierarchy.clinicId}
        initialMonth={hierarchy.dispenseMonth}
      />

      <div className="mt-8">
        <MonthlyDispensedForm hierarchy={hierarchy} />
      </div>
    </div>
  );
};

export default MonthlyTotalsPage;

