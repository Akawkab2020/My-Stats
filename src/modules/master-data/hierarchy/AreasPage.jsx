import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Plus, Loader2 } from 'lucide-react';
import invoke from '../../../api/tauriApi';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import PageHeader from '../../../components/ui/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';

const AreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchBranches = async () => {
    try { const data = await invoke('get_branches'); setBranches(data); } catch { toast.error('فشل تحميل الفروع'); }
  };

  const fetchAreas = async (bid) => {
    setLoading(true);
    try {
      const data = bid ? await invoke('get_areas', { branchId: parseInt(bid) }) : [];
      setAreas(data);
    } catch { toast.error('فشل تحميل المناطق'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { if (filterBranch) fetchAreas(filterBranch); else { setAreas([]); setLoading(false); } }, [filterBranch]);

  const openAdd = () => { setEditItem(null); setName(''); setBranchId(filterBranch); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setName(item.name); setBranchId(item.branch_id || filterBranch); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim() || !branchId) { toast.warning('يرجى ملء جميع الحقول'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await invoke('update_area', { id: editItem.id, name: name.trim(), branchId: parseInt(branchId) });
        toast.success('تم تحديث المنطقة');
      } else {
        await invoke('add_area', { name: name.trim(), branchId: parseInt(branchId) });
        toast.success('تم إضافة المنطقة');
      }
      setModalOpen(false);
      fetchAreas(filterBranch);
    } catch (e) { toast.error(`خطأ: ${e}`); } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (!confirm(`هل أنت متأكد من حذف المنطقة "${item.name}"؟`)) return;
    try { await invoke('delete_area', { id: item.id }); toast.success('تم حذف المنطقة'); fetchAreas(filterBranch); } catch (e) { toast.error(`خطأ: ${e}`); }
  };

  const columns = [
    { header: '#', accessor: 'id' },
    { header: 'اسم المنطقة', accessor: 'name' },
  ];

  return (
    <div dir="rtl">
      <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'الهيكل التنظيمي' }, { label: 'المناطق' }]} />
      <PageHeader title="إدارة المناطق" description="إضافة وتعديل وحذف المناطق" icon={MapPin}
        actions={filterBranch && <Button variant="cta" icon={Plus} onClick={openAdd}>إضافة منطقة</Button>}
      />
      <div className="mb-6" style={{ maxWidth: '300px' }}>
        <Select label="اختر الفرع" icon={Building2} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
          options={branches.map(b => ({ value: b.id, label: b.name }))} placeholder="اختر الفرع لعرض مناطقه..."
        />
      </div>
      {!filterBranch ? (
        <div className="neu-card p-10 text-center"><p style={{ color: 'var(--color-text-muted)' }}>اختر فرعاً لعرض المناطق</p></div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
      ) : (
        <Table columns={columns} data={areas} onEdit={openEdit} onDelete={handleDelete} emptyMessage="لا توجد مناطق لهذا الفرع" />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}>
        <div className="space-y-5">
          <Select label="الفرع" icon={Building2} value={branchId} onChange={e => setBranchId(e.target.value)}
            options={branches.map(b => ({ value: b.id, label: b.name }))} />
          <Input label="اسم المنطقة" icon={MapPin} value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسم المنطقة" style={{ textAlign: 'right' }} />
          <Button variant="cta" loading={saving} onClick={handleSave}>{editItem ? 'تحديث' : 'إضافة'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AreasPage;
