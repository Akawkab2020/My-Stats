import React, { useState, useEffect } from 'react';
import { Building2, Plus, Loader2 } from 'lucide-react';
import invoke from '../../../api/tauriApi';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import PageHeader from '../../../components/ui/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await invoke('get_branches');
      setBranches(data);
    } catch (e) {
      toast.error('فشل في تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditItem(null); setName(''); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setName(item.name); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast.warning('يرجى إدخال اسم الفرع'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await invoke('update_branch', { id: editItem.id, name: name.trim() });
        toast.success('تم تحديث الفرع بنجاح');
      } else {
        await invoke('add_branch', { name: name.trim() });
        toast.success('تم إضافة الفرع بنجاح');
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error(`خطأ: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`هل أنت متأكد من حذف الفرع "${item.name}"؟`)) return;
    try {
      await invoke('delete_branch', { id: item.id });
      toast.success('تم حذف الفرع');
      fetchData();
    } catch (e) {
      toast.error(`خطأ: ${e}`);
    }
  };

  const columns = [
    { header: '#', accessor: 'id' },
    { header: 'اسم الفرع', accessor: 'name' },
  ];

  return (
    <div dir="rtl">
      <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'الهيكل التنظيمي' }, { label: 'الفروع' }]} />
      <PageHeader
        title="إدارة الفروع"
        description="إضافة وتعديل وحذف الفروع"
        icon={Building2}
        actions={<Button variant="cta" icon={Plus} onClick={openAdd}>إضافة فرع</Button>}
      />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
      ) : (
        <Table columns={columns} data={branches} onEdit={openEdit} onDelete={handleDelete} emptyMessage="لا توجد فروع مسجلة" />
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'تعديل الفرع' : 'إضافة فرع جديد'}>
        <div className="space-y-5">
          <Input label="اسم الفرع" icon={Building2} value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسم الفرع" style={{ textAlign: 'right' }} />
          <Button variant="cta" loading={saving} onClick={handleSave} icon={saving ? undefined : Plus}>{editItem ? 'تحديث' : 'إضافة'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default BranchesPage;
