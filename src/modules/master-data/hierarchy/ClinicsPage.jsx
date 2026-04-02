import React, { useState, useEffect } from 'react';
import { Hospital, Building2, MapPin, Plus, Loader2 } from 'lucide-react';
import invoke from '../../../api/tauriApi';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import PageHeader from '../../../components/ui/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';

const ClinicsPage = () => {
  const [clinics, setClinics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    invoke('get_branches').then(setBranches).catch(() => toast.error('فشل تحميل الفروع'));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (filterBranch) {
      invoke('get_areas', { branchId: parseInt(filterBranch) }).then(setAreas).catch(() => {});
      setFilterArea(''); setClinics([]);
    } else { setAreas([]); setFilterArea(''); setClinics([]); }
  }, [filterBranch]);

  useEffect(() => {
    if (filterArea) {
      setLoading(true);
      invoke('get_clinics', { areaId: parseInt(filterArea) }).then(setClinics).catch(() => toast.error('فشل تحميل العيادات')).finally(() => setLoading(false));
    } else { setClinics([]); setLoading(false); }
  }, [filterArea]);

  const openAdd = () => { setEditItem(null); setName(''); setAreaId(filterArea); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setName(item.name); setAreaId(item.area_id || filterArea); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim() || !areaId) { toast.warning('يرجى ملء جميع الحقول'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await invoke('update_clinic', { id: editItem.id, name: name.trim(), areaId: parseInt(areaId) });
        toast.success('تم تحديث العيادة');
      } else {
        await invoke('add_clinic', { name: name.trim(), areaId: parseInt(areaId) });
        toast.success('تم إضافة العيادة');
      }
      setModalOpen(false);
      invoke('get_clinics', { areaId: parseInt(filterArea) }).then(setClinics);
    } catch (e) { toast.error(`خطأ: ${e}`); } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (!confirm(`هل أنت متأكد من حذف العيادة "${item.name}"؟`)) return;
    try { await invoke('delete_clinic', { id: item.id }); toast.success('تم حذف العيادة'); invoke('get_clinics', { areaId: parseInt(filterArea) }).then(setClinics); } catch (e) { toast.error(`خطأ: ${e}`); }
  };

  const columns = [
    { header: '#', accessor: 'id' },
    { header: 'اسم العيادة', accessor: 'name' },
  ];

  return (
    <div dir="rtl">
      <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'الهيكل التنظيمي' }, { label: 'العيادات' }]} />
      <PageHeader title="إدارة العيادات" description="إضافة وتعديل وحذف العيادات" icon={Hospital}
        actions={filterArea && <Button variant="cta" icon={Plus} onClick={openAdd}>إضافة عيادة</Button>}
      />
      <div className="flex gap-4 flex-wrap mb-6">
        <div style={{ minWidth: '200px' }}>
          <Select label="الفرع" icon={Building2} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
            options={branches.map(b => ({ value: b.id, label: b.name }))} placeholder="اختر الفرع..." />
        </div>
        {filterBranch && (
          <div style={{ minWidth: '200px' }}>
            <Select label="المنطقة" icon={MapPin} value={filterArea} onChange={e => setFilterArea(e.target.value)}
              options={areas.map(a => ({ value: a.id, label: a.name }))} placeholder="اختر المنطقة..." />
          </div>
        )}
      </div>
      {!filterArea ? (
        <div className="neu-card p-10 text-center"><p style={{ color: 'var(--color-text-muted)' }}>اختر الفرع والمنطقة لعرض العيادات</p></div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
      ) : (
        <Table columns={columns} data={clinics} onEdit={openEdit} onDelete={handleDelete} emptyMessage="لا توجد عيادات لهذه المنطقة" />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'تعديل العيادة' : 'إضافة عيادة جديدة'}>
        <div className="space-y-5">
          <Select label="المنطقة" icon={MapPin} value={areaId} onChange={e => setAreaId(e.target.value)}
            options={areas.map(a => ({ value: a.id, label: a.name }))} />
          <Input label="اسم العيادة" icon={Hospital} value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسم العيادة" style={{ textAlign: 'right' }} />
          <Button variant="cta" loading={saving} onClick={handleSave}>{editItem ? 'تحديث' : 'إضافة'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClinicsPage;
