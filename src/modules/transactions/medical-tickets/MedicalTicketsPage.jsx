import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import HierarchySelector from '../../../components/common/HierarchySelector';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import invoke from '../../../api/tauriApi';
import { ClipboardList, Hash, Clock, Save } from 'lucide-react';

const MedicalTicketsPage = () => {
  const toast = useToast();
  const location = useLocation();
  const [hierarchy, setHierarchy] = useState({
    branchId: location.state?.branchId || '',
    areaId: location.state?.areaId || '',
    clinicId: location.state?.clinicId || '',
    dispenseMonth: location.state?.dispenseMonth || new Date().toISOString().substring(0, 7)
  });

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    period: 'صباحي',
    ticket_56b_count: '',
    ticket_56c_count: '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hierarchy.branchId) {
      toast.warning('يرجى اختيار الفرع');
      return;
    }
    setSaving(true);
    try {
      await invoke('save_medical_tickets', {
        ...hierarchy,
        ...formData,
        ticket_56b_count: parseInt(formData.ticket_56b_count) || 0,
        ticket_56c_count: parseInt(formData.ticket_56c_count) || 0,
      });
      toast.success('تم حفظ بيانات التذاكر بنجاح');
      setFormData({ period: 'صباحي', ticket_56b_count: '', ticket_56c_count: '' });
    } catch (err) {
      toast.error('فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'العمليات اليومية' }, { label: 'التذاكر الطبية' }]} />
      
      <PageHeader 
        title="التذاكر الطبية" 
        icon={ClipboardList} 
        description="تسجيل أعداد التذاكر الطبية (56ب، 56ج) حسب الفترات."
      />

      <HierarchySelector 
        onSelectionChange={(data) => setHierarchy({ ...hierarchy, ...data })}
        initialBranch={hierarchy.branchId}
        initialArea={hierarchy.areaId}
        initialClinic={hierarchy.clinicId}
        initialMonth={hierarchy.dispenseMonth}
      />

      <Card className="p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              label="الفترة" 
              icon={Clock}
              options={[
                { value: 'صباحي', label: 'صباحي' },
                { value: 'مسائي', label: 'مسائي' },
                { value: 'سهر', label: 'سهر' }
              ]}
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-4">
              <h4 className="text-emerald-700 font-bold flex items-center gap-2">
                <Hash size={18} /> تذاكر 56ب
              </h4>
              <Input 
                label="العدد" 
                type="number" 
                value={formData.ticket_56b_count}
                onChange={(e) => setFormData({ ...formData, ticket_56b_count: e.target.value })}
                placeholder="0"
                className="bg-white"
              />
            </div>

            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 space-y-4">
              <h4 className="text-blue-700 font-bold flex items-center gap-2">
                <Hash size={18} /> تذاكر 56ج
              </h4>
              <Input 
                label="العدد" 
                type="number" 
                value={formData.ticket_56c_count}
                onChange={(e) => setFormData({ ...formData, ticket_56c_count: e.target.value })}
                placeholder="0"
                className="bg-white"
              />
            </div>
          </div>

          <Button variant="primary" type="submit" icon={Save} loading={saving} className="w-full py-4 text-lg">
            حفظ التذاكر
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default MedicalTicketsPage;
