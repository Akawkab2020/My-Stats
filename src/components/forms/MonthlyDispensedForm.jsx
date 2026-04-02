import React, { useState } from 'react';
import { Gift, DollarSign, FileText, Save, Loader2, Building2, GraduationCap, Baby, Heart, Layers } from 'lucide-react';
import invoke from '../../api/tauriApi';
import { useToast } from '../ui/Toast';

const MonthlyDispensedForm = ({ hierarchy }) => {
  const [formData, setFormData] = useState({
    drugs_free_authority: 0,
    drugs_free_students: 0,
    drugs_free_infants: 0,
    drugs_free_breadwinner_women: 0,
    drugs_supported_authority_value: 0,
    drugs_supported_authority_patient_share: 0,
    drugs_supported_students_value: 0,
    drugs_supported_students_patient_share: 0,
    drugs_supported_infants_value: 0,
    drugs_supported_infants_patient_share: 0,
    supplies_total_value: 0,
    notes: '',
  });
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = React.useCallback(async () => {
    if (!hierarchy?.clinicId || !hierarchy?.dispenseMonth) return;
    setLoading(true);
    try {
      const data = await invoke('get_monthly_drugs_dispensed', {
        clinicId: parseInt(hierarchy.clinicId),
        dispenseMonth: hierarchy.dispenseMonth
      });
      if (data) {
        setFormData({
          drugs_free_authority: data.drugs_free_authority,
          drugs_free_students: data.drugs_free_students,
          drugs_free_infants: data.drugs_free_infants,
          drugs_free_breadwinner_women: data.drugs_free_breadwinner_women,
          drugs_supported_authority_value: data.drugs_supported_authority_value,
          drugs_supported_authority_patient_share: data.drugs_supported_authority_patient_share,
          drugs_supported_students_value: data.drugs_supported_students_value,
          drugs_supported_students_patient_share: data.drugs_supported_students_patient_share,
          drugs_supported_infants_value: data.drugs_supported_infants_value,
          drugs_supported_infants_patient_share: data.drugs_supported_infants_patient_share,
          supplies_total_value: data.supplies_total_value || 0,
          notes: data.notes || '',
        });
        setCurrentId(data.id);
      } else {
        setFormData({
          drugs_free_authority: 0,
          drugs_free_students: 0,
          drugs_free_infants: 0,
          drugs_free_breadwinner_women: 0,
          drugs_supported_authority_value: 0,
          drugs_supported_authority_patient_share: 0,
          drugs_supported_students_value: 0,
          drugs_supported_students_patient_share: 0,
          drugs_supported_infants_value: 0,
          drugs_supported_infants_patient_share: 0,
          supplies_total_value: 0,
          notes: '',
        });
        setCurrentId(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('فشل في جلب البيانات المسجلة');
    } finally {
      setLoading(false);
    }
  }, [hierarchy?.clinicId, hierarchy?.dispenseMonth]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!hierarchy?.branchId) {
      toast.warning('يرجى اختيار الفرع أولاً');
      return;
    }
    setSaving(true);
    try {
      await invoke('save_monthly_drugs_dispensed', {
        data: {
          id: currentId,
          clinic_id: hierarchy.clinicId ? parseInt(hierarchy.clinicId) : 0,
          area_id: hierarchy.areaId ? parseInt(hierarchy.areaId) : 0,
          branch_id: parseInt(hierarchy.branchId),
          dispense_month: hierarchy.dispenseMonth,
          ...formData,
          drugs_free_authority: parseFloat(formData.drugs_free_authority) || 0,
          drugs_free_students: parseFloat(formData.drugs_free_students) || 0,
          drugs_free_infants: parseFloat(formData.drugs_free_infants) || 0,
          drugs_free_breadwinner_women: parseFloat(formData.drugs_free_breadwinner_women) || 0,
          drugs_supported_authority_value: parseFloat(formData.drugs_supported_authority_value) || 0,
          drugs_supported_authority_patient_share: parseFloat(formData.drugs_supported_authority_patient_share) || 0,
          drugs_supported_students_value: parseFloat(formData.drugs_supported_students_value) || 0,
          drugs_supported_students_patient_share: parseFloat(formData.drugs_supported_students_patient_share) || 0,
          drugs_supported_infants_value: parseFloat(formData.drugs_supported_infants_value) || 0,
          drugs_supported_infants_patient_share: parseFloat(formData.drugs_supported_infants_patient_share) || 0,
          supplies_total_value: parseFloat(formData.supplies_total_value) || 0,
        }
      });
      toast.success('تم حفظ بيانات المنصرف الشهري بنجاح');
      fetchData();
    } catch (error) {
      toast.error(`خطأ: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const freeFields = [
    { key: 'drugs_free_authority', label: 'هيئة', icon: Building2 },
    { key: 'drugs_free_students', label: 'طلبة', icon: GraduationCap },
    { key: 'drugs_free_infants', label: 'رضع', icon: Baby },
    { key: 'drugs_free_breadwinner_women', label: 'معيلات', icon: Heart },
  ];

  const supportedFields = [
    { key: 'drugs_supported_authority_value', label: 'قيمة الهيئة', type: 'value' },
    { key: 'drugs_supported_authority_patient_share', label: 'حصة المريض - هيئة', type: 'share' },
    { key: 'drugs_supported_students_value', label: 'قيمة الطلبة', type: 'value' },
    { key: 'drugs_supported_students_patient_share', label: 'حصة المريض - طلبة', type: 'share' },
    { key: 'drugs_supported_infants_value', label: 'قيمة الرضع', type: 'value' },
    { key: 'drugs_supported_infants_patient_share', label: 'حصة المريض - رضع', type: 'share' },
  ];

  return (
    <div className="space-y-8" dir="rtl">

      {/* Free Drugs */}
      <section>
        <div className="section-title">
          <div className="section-icon" style={{ background: 'var(--color-bg)', color: 'var(--color-primary)' }}>
            <Gift size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>الأدوية المجانية</h3>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>عدد حالات الصرف المجاني</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {freeFields.map(({ key, label, icon: Icon }) => (
            <div key={key} className="neu-card p-5">
              <label className="field-label">
                <Icon size={16} />
                <span>{label}</span>
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="neu-input"
                style={{ textAlign: 'center', fontWeight: 700, fontSize: '18px' }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Supported Drugs */}
      <section>
        <div className="section-title">
          <div className="section-icon" style={{ background: '#ECFDF5', color: 'var(--color-cta)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>الأدوية المدعّمة</h3>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>القيم المالية وحصص المشاركة</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedFields.map(({ key, label, type }) => (
            <div
              key={key}
              className="neu-card p-5"
              style={{ borderBottom: `3px solid ${type === 'value' ? 'var(--color-cta)' : 'var(--color-warning)'}` }}
            >
              <label className="field-label">
                <DollarSign size={16} />
                <span>{label}</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="neu-input"
                style={{ textAlign: 'center', fontWeight: 700, fontSize: '18px' }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Medical Supplies */}
      <section>
        <div className="section-title">
          <div className="section-icon" style={{ background: '#F0F9FF', color: '#0EA5E9' }}>
            <Layers size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>المستلزمات الطبية</h3>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>إجمالي قيمة المنصرف من المستلزمات</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="neu-card p-5">
            <label className="field-label">
              <Layers size={16} />
              <span>إجمالي قيمة المستلزمات</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.supplies_total_value || ''}
              onChange={(e) => handleChange('supplies_total_value', e.target.value)}
              className="neu-input"
              style={{ textAlign: 'center', fontWeight: 700, fontSize: '18px' }}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <div className="neu-card p-5">
        <label className="field-label">
          <FileText size={16} />
          <span>ملاحظات</span>
        </label>
        <textarea
          rows="2"
          className="neu-input"
          style={{ textAlign: 'right', fontWeight: 500, fontSize: '15px', resize: 'vertical' }}
          placeholder="أضف ملاحظاتك هنا..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
        />
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="neu-btn-primary">
        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        <span>{saving ? 'جاري الحفظ...' : 'حفظ المنصرف الشهري'}</span>
      </button>
    </div>
  );
};

export default MonthlyDispensedForm;
