import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import HierarchySelector from '../../../components/common/HierarchySelector';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import invoke from '../../../api/tauriApi';
import { Pill, DollarSign, Save, History } from 'lucide-react';

const GroupCostsPage = () => {
  const toast = useToast();
  const location = useLocation();
  const [hierarchy, setHierarchy] = useState({
    branchId: location.state?.branchId || '',
    areaId: location.state?.areaId || '',
    clinicId: location.state?.clinicId || '',
    dispenseMonth: location.state?.dispenseMonth || new Date().toISOString().substring(0, 7)
  });

  const [groups, setGroups] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    groupId: '',
    cost: '',
  });

  useEffect(() => {
    loadMetaData();
  }, []);

  const loadMetaData = async () => {
    setLoading(true);
    try {
      const g = await invoke('get_drug_groups');
      setGroups(g);
    } catch (err) {
      showToast('خطأ في تحميل المجموعات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hierarchy.branchId || !formData.groupId) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const groupName = groups.find(g => g.id === parseInt(formData.groupId))?.name;
      const payload = {
        ...hierarchy,
        groupId: parseInt(formData.groupId),
        cost: parseFloat(formData.cost) || 0
      };
      await invoke('save_drug_group_cost', payload);
      toast.success('تم حفظ تكلفة المجموعة بنجاح');
      setHistory(prev => [{ ...payload, groupName, id: Date.now() }, ...prev].slice(0, 5));
      setFormData({ ...formData, cost: '' });
    } catch (err) {
      toast.error('فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'العمليات اليومية' }, { label: 'تكلفة المجموعات' }]} />
      
      <PageHeader 
        title="تكلفة المجموعات الدوائية" 
        icon={Pill} 
        description="تسجيل التكاليف المالية الإجمالية للمجموعات الدوائية المختلفة."
      />

      <HierarchySelector 
        onSelectionChange={(data) => setHierarchy({ ...hierarchy, ...data })}
        initialBranch={hierarchy.branchId}
        initialArea={hierarchy.areaId}
        initialClinic={hierarchy.clinicId}
        initialMonth={hierarchy.dispenseMonth}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="المجموعة الدوائية"
                options={groups.map(g => ({ value: g.id, label: g.name }))}
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                required
              />
              <Input 
                label="التكلفة الإجمالية" 
                type="number" step="0.01" icon={DollarSign}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
              />
            </div>

            <Button variant="primary" type="submit" icon={Save} loading={saving} className="w-full py-4 text-lg">
              حفظ التكلفة
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-cyan-900 font-bold">
            <History size={18} />
            <span>آخر التكاليف المسجلة</span>
          </div>
          <Card className="p-0 overflow-hidden">
            <Table 
              columns={[
                { header: 'المجموعة', accessor: 'groupName' },
                { header: 'التكلفة', accessor: 'cost' }
              ]} 
              data={history} 
              loading={false} 
              actions={false} 
            />
            {history.length === 0 && (
              <div className="p-8 text-center text-cyan-500 text-sm italic">
                لا توجد سجلات حالية.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GroupCostsPage;
