import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { Scale, Users, Pill, Save, History, Hash } from 'lucide-react';

const JudicialDispensingPage = () => {
  const toast = useToast();
  const location = useLocation();
  const [hierarchy, setHierarchy] = useState({
    branchId: location.state?.branchId || '',
    areaId: location.state?.areaId || '',
    clinicId: location.state?.clinicId || '',
    dispenseMonth: location.state?.dispenseMonth || new Date().toISOString().substring(0, 7)
  });

  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    medicineId: '',
    quantity: '',
  });

  useEffect(() => {
    loadMetaData();
  }, []);

  const loadMetaData = async () => {
    setLoading(true);
    try {
      const [ps, ms] = await Promise.all([
        invoke('get_judicial_patients'),
        invoke('get_judicial_medicines')
      ]);
      setPatients(ps);
      setMedicines(ms);
    } catch (err) {
      showToast('خطأ في تحميل البيانات الأساسية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!hierarchy.clinicId || !hierarchy.dispenseMonth) return;
    setLoading(true);
    try {
      const data = await invoke('get_judicial_dispensed', {
        clinicId: parseInt(hierarchy.clinicId),
        dispenseMonth: hierarchy.dispenseMonth
      });
      // Map patient and medicine names for display
      const enriched = data.map(record => ({
        ...record,
        patientName: patients.find(p => p.id === record.patient_id)?.name || 'مريض غير معروف',
        medicineName: record.medicine_name,
        quantity: record.monthly_dose // based on schema mapping
      }));
      setHistory(enriched);
    } catch (err) {
      console.error(err);
      toast.error('فشل في تحميل سجل الصرف القضائي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [hierarchy.clinicId, hierarchy.dispenseMonth, patients, medicines]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hierarchy.branchId || !formData.patientId || !formData.medicineId) {
      toast.warning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const selectedPatient = patients.find(p => p.id === parseInt(formData.patientId));
      const selectedMedicine = medicines.find(m => m.id === parseInt(formData.medicineId));
      
      const payload = {
        id: null,
        patient_id: parseInt(formData.patientId),
        diagnosis: selectedPatient?.diagnosis || '',
        medicine_name: selectedMedicine?.name || '',
        unit: selectedMedicine?.unit || '',
        unit_price: 0,
        monthly_dose: parseFloat(formData.quantity) || 0,
        monthly_cost: 0,
        dispense_month: hierarchy.dispenseMonth,
        clinic_id: parseInt(hierarchy.clinicId),
        area_id: parseInt(hierarchy.areaId),
      };
      await invoke('save_judicial_dispensed', { data: payload });
      toast.success('تم حفظ بيانات الصرف القضائي');
      loadHistory();
      setFormData({ ...formData, medicineId: '', quantity: '' });
    } catch (err) {
      toast.error(`فشل حفظ البيانات: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumb items={[{ label: 'العمليات اليومية' }, { label: 'صرف أحكام المحكمة' }]} />
      
      <PageHeader 
        title="صرف أحكام المحكمة" 
        icon={Scale} 
        description="تسجيل المنصرف للمرضى الحاصلين على أحكام قضائية."
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
            <Select 
              label="المريض" icon={Users}
              options={patients.map(p => ({ value: p.id, label: p.name }))}
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="الدواء القضائي" icon={Pill}
                options={medicines.map(m => ({ value: m.id, label: m.name }))}
                value={formData.medicineId}
                onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                required
              />
              <Input 
                label="الكمية" icon={Hash} type="number" step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <Button variant="primary" type="submit" icon={Save} loading={saving} className="w-full py-4 text-lg">
              إضافة صرف قضائي
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-cyan-900 font-bold">
            <History size={18} />
            <span>آخر العمليات القضائية</span>
          </div>
          <Card className="p-0 overflow-hidden">
            <Table 
              columns={[
                { header: 'المريض', accessor: 'patientName' },
                { header: 'الدواء', accessor: 'medicineName' },
                { header: 'الكمية', accessor: 'quantity' }
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

export default JudicialDispensingPage;
